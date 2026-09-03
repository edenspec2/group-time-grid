import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer } from "ws";
import { createEvent, getEvent, publicEvent, updateEvent } from "./store.js";
import { applySlotUpdates, DEFAULT_DURATION_MINUTES, isValidDuration } from "../src/lib/event.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const rooms = new Map(); // eventId -> Set<WebSocket>

function hashPassword(eventId, name, password) {
  if (!password) return "";
  return crypto
    .createHash("sha256")
    .update(`${eventId}:${name}:${password}`)
    .digest("hex");
}

function newId() {
  return crypto.randomBytes(5).toString("hex").slice(0, 8);
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

function applyPaint(event, name, updates) {
  updateEvent(event.id, (e) => {
    if (!e.marks[name]) e.marks[name] = {};
    applySlotUpdates(e.marks[name], updates);
  });
  return getEvent(event.id);
}

function authPerson(event, name, password) {
  const person = event.people.find((p) => p.name.toLowerCase() === String(name).toLowerCase());
  if (!person) return { error: "Sign in first" };
  if (person.passwordHash && person.passwordHash !== hashPassword(event.id, name, password)) {
    return { error: "Wrong name or password" };
  }
  return { person };
}

app.post("/api/events", (req, res) => {
  const {
    name,
    managerName,
    managerEmail = "",
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
  if (!title) return res.status(400).json({ error: "Event name is required" });
  if (!organizer) return res.status(400).json({ error: "Manager name is required" });
  if (mode === "dates" && (!Array.isArray(dates) || dates.length === 0)) {
    return res.status(400).json({ error: "Pick at least one date" });
  }
  if (mode === "weekdays" && (!Array.isArray(weekdays) || weekdays.length === 0)) {
    return res.status(400).json({ error: "Pick at least one weekday" });
  }
  if (!(hourStart >= 0 && hourEnd > hourStart && hourEnd <= 24)) {
    return res.status(400).json({ error: "Invalid time range" });
  }

  const duration = isValidDuration(Number(durationMinutes)) ? Number(durationMinutes) : DEFAULT_DURATION_MINUTES;
  const id = newId();
  const event = createEvent({
    id,
    name: title,
    mode: mode === "weekdays" ? "weekdays" : "dates",
    dates: mode === "weekdays" ? [] : [...new Set(dates)].sort(),
    weekdays: mode === "dates" ? [] : [...new Set(weekdays)].sort(),
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
      passwordHash: "",
      hasPassword: false,
      joinedAt: new Date().toISOString(),
    }],
    marks: { [organizer]: {} },
  });

  res.json(publicEvent(event));
});

app.get("/api/events/:id", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(publicEvent(event));
});

app.post("/api/events/:id/join", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const password = String(req.body?.password || "");
  const email = String(req.body?.email || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (name.length > 40) return res.status(400).json({ error: "Name is too long" });

  const existing = event.people.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    const result = authPerson(event, existing.name, password);
    if (result.error) return res.status(403).json({ error: result.error });
    if (email) {
      updateEvent(event.id, (e) => {
        const person = e.people.find((p) => p.name === existing.name);
        if (person) person.email = email;
      });
    }
    const updated = getEvent(event.id);
    return res.json({
      name: existing.name,
      event: publicEvent(updated, { includeEmails: isManager(updated, existing.name) }),
    });
  }

  updateEvent(event.id, (e) => {
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

  const updated = getEvent(event.id);
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json({
    name,
    event: publicEvent(updated, { includeEmails: isManager(updated, name) }),
  });
});

app.post("/api/events/:id/paint", (req, res) => {
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
  const updated = applyPaint(event, name, cleaned);
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: isManager(updated, name) }));
});

app.post("/api/events/:id/pin", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  if (!isManager(event, result.person.name) && event.managerName) {
    return res.status(403).json({ error: "Only the manager can change the meeting setup" });
  }

  const pinnedSlot = req.body?.pinnedSlot ?? null;
  const hideReds = req.body?.hideReds;
  const durationMinutes = req.body?.durationMinutes;

  const updated = updateEvent(event.id, (e) => {
    if (!e.managerName) e.managerName = result.person.name;
    if (pinnedSlot === null || typeof pinnedSlot === "string") e.pinnedSlot = pinnedSlot;
    if (typeof hideReds === "boolean") e.hideReds = hideReds;
    if (isValidDuration(durationMinutes)) e.durationMinutes = durationMinutes;
  });
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: true }));
});

app.post("/api/events/:id/claim-manager", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  if (event.managerName && !isManager(event, result.person.name)) {
    return res.status(403).json({ error: `${event.managerName} is already the manager` });
  }
  const updated = updateEvent(event.id, (e) => {
    e.managerName = result.person.name;
  });
  broadcast(event.id, { type: "state", event: publicEvent(updated) });
  res.json(publicEvent(updated, { includeEmails: true }));
});

app.post("/api/events/:id/mail", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const name = String(req.body?.name || "").trim();
  const result = authPerson(event, name, String(req.body?.password || ""));
  if (result.error) return res.status(403).json({ error: result.error });
  if (!isManager(event, result.person.name)) {
    return res.status(403).json({ error: "Only the manager can email the group" });
  }
  const emails = event.people.map((p) => p.email).filter(Boolean);
  const missing = event.people.filter((p) => !p.email).map((p) => p.name);
  res.json({ emails, missing, managerEmail: result.person.email || "" });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  let subscribed = null;

  ws.on("message", (raw) => {
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
      applyPaint(event, name, updates);
      const updated = getEvent(event.id);
      broadcast(event.id, { type: "state", event: publicEvent(updated) });
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(dev ? `API on http://127.0.0.1:${PORT}` : `Group Time Grid on http://0.0.0.0:${PORT}`);
});
