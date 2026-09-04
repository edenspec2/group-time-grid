import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { WebSocketServer } from "ws";
import {
  createEvent,
  getEvent,
  initializeStore,
  publicEvent,
  readMaterial,
  removeMaterial,
  updateEvent,
  writeMaterial,
} from "./store.js";
import {
  applySlotUpdates,
  DEFAULT_DURATION_MINUTES,
  isValidDuration,
  MAX_MATERIAL_FILE_BYTES,
  MAX_MATERIAL_TOTAL_BYTES,
  MAX_MATERIALS,
  normalizeMaterialUrl,
} from "../src/lib/event.js";
import { eventSlots, parseSlot } from "../src/lib/slots.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "6mb" }));
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many events created from this connection. Try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again later." },
});
const materialsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many material changes. Try again later." },
});

app.get("/uploads/:eventId/:storedName", asyncRoute(async (req, res) => {
  const event = getEvent(req.params.eventId);
  const url = `/uploads/${req.params.eventId}/${req.params.storedName}`;
  const item = event?.materials?.find((material) => material.url === url);
  if (!item) return res.status(404).json({ error: "File not found" });
  const contents = await readMaterial(req.params.eventId, req.params.storedName);
  if (!contents) return res.status(404).json({ error: "File not found" });
  const filename = safeFileName(item.filename || "download");
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(contents);
}));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const rooms = new Map(); // eventId -> Set<WebSocket>

function legacyPasswordHash(eventId, name, password) {
  if (!password) return "";
  return crypto
    .createHash("sha256")
    .update(`${eventId}:${name}:${password}`)
    .digest("hex");
}

function hashPassword(eventId, name, password) {
  if (!password) return "";
  const salt = `${eventId}:${String(name).toLowerCase()}`;
  return `scrypt:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(eventId, person, password) {
  if (!person.passwordHash) return !password;
  if (!person.passwordHash.startsWith("scrypt:")) {
    return person.passwordHash === legacyPasswordHash(eventId, person.name, password);
  }
  const expected = Buffer.from(person.passwordHash.slice("scrypt:".length), "hex");
  const actual = crypto.scryptSync(password, `${eventId}:${person.name.toLowerCase()}`, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function newId() {
  return crypto.randomBytes(16).toString("hex");
}

function broadcast(eventId, payload, except) {
  const clients = rooms.get(eventId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws !== except && ws.readyState === 1) ws.send(data);
  }
}

function isManager(event, name) {
  return Boolean(event.managerName && name && event.managerName.toLowerCase() === name.toLowerCase());
}

function canManage(event, person) {
  return Boolean(person?.passwordHash && isManager(event, person.name));
}

function managerError(event, person) {
  if (!isManager(event, person?.name)) return "Only the manager can do that";
  if (!person.passwordHash) return "This legacy manager account must be secured before it can manage the event";
  return "";
}

function validDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validTimezone(value) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function validMeetingStart(event, startId, durationMinutes = event.durationMinutes) {
  if (typeof startId !== "string") return false;
  let parsed;
  try {
    parsed = parseSlot(startId);
  } catch {
    return false;
  }
  const { cols, times } = eventSlots(event);
  const startIndex = times.findIndex((time) => time.hour === parsed.hour && time.minute === parsed.minute);
  const requiredSlots = durationMinutes / 30;
  return cols.some((column) => column.key === parsed.columnKey)
    && startIndex >= 0
    && Number.isInteger(requiredSlots)
    && startIndex + requiredSlots <= times.length;
}

async function applyPaint(event, name, updates) {
  const validSlots = new Set(eventSlots(event).ids);
  const cleaned = Object.fromEntries(
    Object.entries(updates || {}).filter(([slotId]) => validSlots.has(slotId)),
  );
  await updateEvent(event.id, (e) => {
    if (!e.marks[name]) e.marks[name] = {};
    applySlotUpdates(e.marks[name], cleaned);
  });
  return getEvent(event.id);
}

function authPerson(event, name, password) {
  const person = event.people.find((p) => p.name.toLowerCase() === String(name).toLowerCase());
  if (!person) return { error: "Sign in first" };
  if (!verifyPassword(event.id, person, password)) {
    return { error: "Wrong name or password" };
  }
  return { person };
}

app.post("/api/events", createLimiter, asyncRoute(async (req, res) => {
  const {
    name,
    managerName,
    managerEmail = "",
    managerPassword = "",
    mode = "dates",
    dates = [],
    weekdays = [],
    hourStart = 9,
    hourEnd = 17,
    timezone,
    durationMinutes = DEFAULT_DURATION_MINUTES,
  } = req.body || {};

  const title = String(name || "").trim();
  const organizer = String(managerName || "").trim();
  const email = String(managerEmail || "").trim();
  const password = String(managerPassword || "");
  const eventMode = mode === "weekdays" ? "weekdays" : mode === "dates" ? "dates" : "";
  if (!title) return res.status(400).json({ error: "Event name is required" });
  if (title.length > 120) return res.status(400).json({ error: "Event name is too long" });
  if (!organizer) return res.status(400).json({ error: "Manager name is required" });
  if (organizer.length > 40) return res.status(400).json({ error: "Manager name is too long" });
  if (password.length < 8) return res.status(400).json({ error: "Manager password must be at least 8 characters" });
  if (!eventMode) return res.status(400).json({ error: "Invalid survey mode" });
  if (eventMode === "dates" && (!Array.isArray(dates) || dates.length === 0)) {
    return res.status(400).json({ error: "Pick at least one date" });
  }
  if (eventMode === "dates" && !dates.every(validDateKey)) {
    return res.status(400).json({ error: "One or more dates are invalid" });
  }
  if (eventMode === "weekdays" && (!Array.isArray(weekdays) || weekdays.length === 0)) {
    return res.status(400).json({ error: "Pick at least one weekday" });
  }
  if (eventMode === "weekdays" && !weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
    return res.status(400).json({ error: "One or more weekdays are invalid" });
  }
  if (!(hourStart >= 0 && hourEnd > hourStart && hourEnd <= 24)) {
    return res.status(400).json({ error: "Invalid time range" });
  }
  if (!validTimezone(timezone || "UTC")) return res.status(400).json({ error: "Invalid timezone" });

  const duration = isValidDuration(Number(durationMinutes)) ? Number(durationMinutes) : DEFAULT_DURATION_MINUTES;
  if ((Number(hourEnd) - Number(hourStart)) * 60 < duration) {
    return res.status(400).json({ error: "The time window must be at least as long as the meeting" });
  }
  const id = newId();
  const event = await createEvent({
    id,
    name: title,
    mode: eventMode,
    dates: eventMode === "weekdays" ? [] : [...new Set(dates)].sort(),
    weekdays: eventMode === "dates" ? [] : [...new Set(weekdays)].sort(),
    hourStart: Number(hourStart),
    hourEnd: Number(hourEnd),
    timezone: timezone || "UTC",
    durationMinutes: duration,
    createdAt: new Date().toISOString(),
    pinnedSlot: null,
    hideReds: false,
    managerName: organizer,
    people: [{
      name: organizer,
      email,
      passwordHash: hashPassword(id, organizer, password),
      hasPassword: true,
      joinedAt: new Date().toISOString(),
    }],
    marks: { [organizer]: {} },
    materials: [],
  });

  res.json(publicEvent(event));
}));

app.get("/api/events/:id", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(publicEvent(event));
});

app.post("/api/events/:id/join", authLimiter, asyncRoute(async (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const password = String(req.body?.password || "");
  const email = String(req.body?.email || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (name.length > 40) return res.status(400).json({ error: "Name is too long" });

  const existing = event.people.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (isManager(event, existing.name) && !existing.passwordHash && password) {
      if (password.length < 8) {
        return res.status(400).json({ error: "Manager password must be at least 8 characters" });
      }
      if (!existing.email || existing.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ error: "Enter the manager email previously saved for this event" });
      }
      await updateEvent(event.id, (e) => {
        const person = e.people.find((candidate) => candidate.name === existing.name);
        person.passwordHash = hashPassword(event.id, person.name, password);
        person.hasPassword = true;
      });
      const updated = getEvent(event.id);
      const secured = updated.people.find((person) => person.name === existing.name);
      return res.json({
        name: existing.name,
        event: publicEvent(updated, { includeEmails: canManage(updated, secured) }),
      });
    }
    const result = authPerson(event, existing.name, password);
    if (result.error) return res.status(403).json({ error: result.error });
    if (email) {
      await updateEvent(event.id, (e) => {
        const person = e.people.find((p) => p.name === existing.name);
        if (person) person.email = email;
      });
    }
    const updated = getEvent(event.id);
    return res.json({
      name: existing.name,
      event: publicEvent(updated, { includeEmails: canManage(updated, existing) }),
    });
  }

  let duplicateName = "";
  await updateEvent(event.id, (e) => {
    const duplicate = e.people.find((person) => person.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      duplicateName = duplicate.name;
      return;
    }
    e.people.push({
      name,
      email,
      passwordHash: hashPassword(event.id, name, password),
      hasPassword: Boolean(password),
      joinedAt: new Date().toISOString(),
    });
    e.marks[name] = {};
    if (!e.managerName) e.managerName = name;
  });

  let updated = getEvent(event.id);
  if (duplicateName) {
    const duplicateAuth = authPerson(updated, duplicateName, password);
    if (duplicateAuth.error) return res.status(403).json({ error: duplicateAuth.error });
    if (email) {
      await updateEvent(event.id, (e) => {
        const person = e.people.find((candidate) => candidate.name === duplicateName);
        if (person) person.email = email;
      });
      updated = getEvent(event.id);
    }
    return res.json({
      name: duplicateName,
      event: publicEvent(updated, { includeEmails: canManage(updated, duplicateAuth.person) }),
    });
  }
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json({
    name,
    event: publicEvent(updated, { includeEmails: canManage(updated, updated.people.find((p) => p.name === name)) }),
  });
}));

app.post("/api/events/:id/paint", asyncRoute(async (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  const updates = req.body?.updates && typeof req.body.updates === "object" ? req.body.updates : {};
  const allowed = new Set(["green", "yellow", "red"]);
  const cleaned = {};
  for (const [slotId, status] of Object.entries(updates)) {
    if (allowed.has(status)) cleaned[slotId] = status;
  }
  const updated = await applyPaint(event, result.person.name, cleaned);
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: canManage(updated, result.person) }));
}));

app.post("/api/events/:id/pin", asyncRoute(async (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  const permissionError = managerError(event, result.person);
  if (permissionError) return res.status(403).json({ error: permissionError });

  const hasPinnedSlot = Object.prototype.hasOwnProperty.call(req.body || {}, "pinnedSlot");
  const pinnedSlot = req.body?.pinnedSlot;
  const hideReds = req.body?.hideReds;
  const durationMinutes = isValidDuration(req.body?.durationMinutes)
    ? req.body.durationMinutes
    : event.durationMinutes;
  if (hasPinnedSlot && pinnedSlot !== null && !validMeetingStart(event, pinnedSlot, durationMinutes)) {
    return res.status(400).json({ error: "That meeting block is outside the event schedule" });
  }

  const updated = await updateEvent(event.id, (e) => {
    if (hasPinnedSlot) e.pinnedSlot = pinnedSlot;
    if (typeof hideReds === "boolean") e.hideReds = hideReds;
    if (isValidDuration(req.body?.durationMinutes)) {
      e.durationMinutes = durationMinutes;
      if (e.pinnedSlot && !validMeetingStart(e, e.pinnedSlot, durationMinutes)) e.pinnedSlot = null;
    }
  });
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: true }));
}));

function safeFileName(name) {
  const cleaned = String(name || "file").replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 80) || "file";
}

function allowedUpload(filename, mime) {
  const extension = path.extname(String(filename || "")).toLowerCase();
  const allowed = {
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ".ppt": ["application/vnd.ms-powerpoint"],
    ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ".txt": ["text/plain"],
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
  };
  return Boolean(allowed[extension] && (!mime || allowed[extension].includes(String(mime).toLowerCase())));
}

function validBase64(value) {
  const encoded = String(value || "").replace(/\s/g, "");
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return false;
  return Buffer.from(encoded, "base64").toString("base64") === encoded;
}

function validFileContents(filename, contents) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".pdf") return contents.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".png") return contents.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === ".jpg" || extension === ".jpeg") {
    return contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff;
  }
  if (extension === ".doc") {
    return contents.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  }
  if (extension === ".docx" || extension === ".pptx") {
    return contents.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }
  if (extension === ".ppt") {
    return contents.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  }
  return extension === ".txt" && !contents.includes(0);
}

app.post("/api/events/:id/materials", materialsLimiter, asyncRoute(async (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });

  const action = req.body?.action === "remove" ? "remove" : "add";

  if (action === "remove") {
    const materialId = String(req.body?.materialId || "");
    const item = (event.materials || []).find((m) => m.id === materialId);
    if (!item) return res.status(404).json({ error: "That item is not on this meeting" });
    if (item.addedBy !== result.person.name && !canManage(event, result.person)) {
      return res.status(403).json({ error: "Only the person who pinned it, or the manager, can remove it" });
    }
    const updated = await updateEvent(event.id, (e) => {
      e.materials = (e.materials || []).filter((m) => m.id !== materialId);
    });
    const prefix = `/uploads/${event.id}/`;
    if (item.url?.startsWith(prefix)) {
      await removeMaterial(event.id, item.url.slice(prefix.length)).catch(() => {});
    }
    broadcast(event.id, { type: "state", event: publicEvent(updated) });
    return res.json(publicEvent(updated, { includeEmails: canManage(updated, result.person) }));
  }

  if ((event.materials || []).length >= MAX_MATERIALS) {
    return res.status(400).json({ error: "This meeting already has the maximum number of pinned items" });
  }

  const kinds = new Set(["paper", "topic", "link", "file"]);
  let kind = kinds.has(req.body?.kind) ? req.body.kind : "link";
  const title = String(req.body?.title || "").trim().slice(0, 200);
  const note = String(req.body?.note || "").trim().slice(0, 400);
  if (!title) return res.status(400).json({ error: "Give the paper or topic a title" });

  let url = "";
  let filename = "";
  let fileSize = 0;
  const file = req.body?.file;
  let stored = "";

  if (file?.data) {
    if (!validBase64(file.data)) return res.status(400).json({ error: "Could not read that file" });
    const buf = Buffer.from(String(file.data), "base64");
    if (!buf.length) return res.status(400).json({ error: "That file is empty" });
    if (buf.length > MAX_MATERIAL_FILE_BYTES) {
      return res.status(400).json({ error: "Files must be 4 MB or smaller. Pin a Drive or PDF link instead." });
    }
    const storedBytes = (event.materials || []).reduce((sum, material) => sum + (material.fileSize || 0), 0);
    if (storedBytes + buf.length > MAX_MATERIAL_TOTAL_BYTES) {
      return res.status(400).json({ error: "This meeting has reached its 20 MB upload limit. Remove a file or use a link." });
    }
    const original = safeFileName(file.filename);
    if (!allowedUpload(original, file.mime)) {
      return res.status(400).json({ error: "Use a PDF, Word, PowerPoint, text, or image file" });
    }
    if (!validFileContents(original, buf)) {
      return res.status(400).json({ error: "The file contents do not match its file type" });
    }
    stored = `${newId()}-${original}`;
    await writeMaterial(event.id, stored, buf);
    url = `/uploads/${event.id}/${stored}`;
    filename = original;
    fileSize = buf.length;
    if (kind !== "paper" && kind !== "topic") kind = "file";
  } else {
    const rawUrl = String(req.body?.url || "").trim();
    url = normalizeMaterialUrl(rawUrl);
    if (rawUrl && !url) return res.status(400).json({ error: "Use a valid DOI or web link" });
    if (!url && kind !== "topic") {
      return res.status(400).json({ error: "Add a DOI, link, or file" });
    }
  }

  const item = {
    id: newId(),
    kind,
    title,
    url,
    note,
    filename,
    fileSize,
    addedBy: result.person.name,
    addedAt: new Date().toISOString(),
  };
  let capacityError = "";
  let updated;
  try {
    updated = await updateEvent(event.id, (e) => {
      e.materials = e.materials || [];
      if (e.materials.length >= MAX_MATERIALS) {
        capacityError = "This meeting already has the maximum number of pinned items";
        return;
      }
      const storedBytes = e.materials.reduce((sum, material) => sum + (material.fileSize || 0), 0);
      if (storedBytes + fileSize > MAX_MATERIAL_TOTAL_BYTES) {
        capacityError = "This meeting has reached its 20 MB upload limit. Remove a file or use a link.";
        return;
      }
      e.materials.push(item);
    });
  } catch (error) {
    if (stored) await removeMaterial(event.id, stored).catch(() => {});
    throw error;
  }
  if (capacityError) {
    if (stored) await removeMaterial(event.id, stored).catch(() => {});
    return res.status(400).json({ error: capacityError });
  }
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: canManage(updated, result.person) }));
}));

app.post("/api/events/:id/claim-manager", asyncRoute(async (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  if (event.managerName && !isManager(event, result.person.name)) {
    return res.status(403).json({ error: `${event.managerName} is already the manager` });
  }
  if (!result.person.passwordHash) {
    return res.status(400).json({ error: "Set a password before becoming the manager" });
  }
  const updated = await updateEvent(event.id, (e) => {
    e.managerName = result.person.name;
  });
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: true }));
}));

app.post("/api/events/:id/mail", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  const permissionError = managerError(event, result.person);
  if (permissionError) return res.status(403).json({ error: permissionError });
  const emails = event.people.map((p) => p.email).filter(Boolean);
  const missing = event.people.filter((p) => !p.email).map((p) => p.name);
  res.json({ emails, missing, managerEmail: result.person.email || "" });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  let subscribed = null;

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "subscribe") {
      const event = getEvent(msg.eventId);
      if (!event) {
        ws.send(JSON.stringify({ type: "error", error: "Event not found" }));
        return;
      }
      if (subscribed) rooms.get(subscribed)?.delete(ws);
      subscribed = event.id;
      if (!rooms.has(subscribed)) rooms.set(subscribed, new Set());
      rooms.get(subscribed).add(ws);
      ws.send(JSON.stringify({ type: "state", event: publicEvent(event) }));
      return;
    }

    if (msg.type === "paint") {
      const event = getEvent(msg.eventId);
      if (!event) return;
      const name = String(msg.name || "").trim();
      const result = authPerson(event, name, String(msg.password || ""));
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", error: result.error }));
        return;
      }
      const updates = msg.updates && typeof msg.updates === "object" ? msg.updates : {};
      try {
        const updated = await applyPaint(event, result.person.name, updates);
        broadcast(event.id, { type: "state", event: publicEvent(updated) });
      } catch {
        ws.send(JSON.stringify({ type: "error", error: "Could not save availability" }));
      }
    }
  });

  ws.on("close", () => {
    if (subscribed) rooms.get(subscribed)?.delete(ws);
  });
});

if (!dev) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (!res.headersSent) res.status(500).json({ error: "Could not save that change" });
});

await initializeStore();

server.listen(PORT, "0.0.0.0", () => {
  console.log(dev ? `API on http://127.0.0.1:${PORT}` : `Group Time Grid on http://0.0.0.0:${PORT}`);
});
