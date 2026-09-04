import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "events.json");
const bucket = process.env.SUPABASE_BUCKET || "group-time-grid";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null;

let db = { events: {} };
let mutationQueue = Promise.resolve();

function parseDb(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed?.events && typeof parsed.events === "object" ? parsed : { events: {} };
  } catch {
    return { events: {} };
  }
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (data.some((item) => item.name === bucket)) return;
  const { error: createError } = await supabase.storage.createBucket(bucket, { public: false });
  if (createError && !/already exists/i.test(createError.message || "")) throw createError;
}

export async function initializeStore() {
  if (Boolean(supabaseUrl) !== Boolean(supabaseKey)) {
    throw new Error("Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!supabase && process.env.NODE_ENV === "production" && process.env.ALLOW_EPHEMERAL_STORAGE !== "true") {
    throw new Error("Durable storage is required in production. Configure Supabase or explicitly allow ephemeral storage.");
  }
  if (supabase) {
    await ensureBucket();
    const { data, error } = await supabase.storage.from(bucket).download("events.json");
    if (!error && data) {
      db = parseDb(await data.text());
    } else if (error && !/not found/i.test(error.message || "")) {
      throw error;
    } else {
      let localSnapshot = "";
      try {
        localSnapshot = fs.readFileSync(dataFile, "utf8");
      } catch {
        // A new deployment may have no local data to migrate.
      }
      db = localSnapshot ? parseDb(localSnapshot) : { events: {} };
      if (Object.keys(db.events).length) await save();
    }
    return;
  }
  try {
    db = parseDb(fs.readFileSync(dataFile, "utf8"));
  } catch {
    db = { events: {} };
  }
}

async function save() {
  const json = JSON.stringify(db);
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).upload(
      "events.json",
      Buffer.from(json),
      { contentType: "application/json", upsert: true },
    );
    if (error) throw error;
    return;
  }
  fs.mkdirSync(dataDir, { recursive: true });
  const temporary = `${dataFile}.tmp`;
  fs.writeFileSync(temporary, json);
  fs.renameSync(temporary, dataFile);
}

function mutate(fn) {
  const operation = mutationQueue.then(async () => {
    const previous = structuredClone(db);
    try {
      const result = fn();
      await save();
      return result;
    } catch (error) {
      db = previous;
      throw error;
    }
  });
  mutationQueue = operation.catch(() => {});
  return operation;
}

export function getEvent(id) {
  return db.events[id] || null;
}

export function createEvent(event) {
  return mutate(() => {
    db.events[event.id] = event;
    return event;
  });
}

export function updateEvent(id, fn) {
  return mutate(() => {
    const event = db.events[id];
    if (!event) return null;
    fn(event);
    return event;
  });
}

function materialObjectPath(eventId, storedName) {
  if (!/^[a-zA-Z0-9_-]+$/.test(eventId) || !/^[a-zA-Z0-9_.-]+$/.test(storedName)) {
    throw new Error("Invalid material path");
  }
  return `uploads/${eventId}/${storedName}`;
}

export async function writeMaterial(eventId, storedName, contents) {
  const objectPath = materialObjectPath(eventId, storedName);
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).upload(objectPath, contents, {
      contentType: "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    return;
  }
  const dir = path.join(dataDir, "uploads", eventId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, storedName), contents);
}

export async function readMaterial(eventId, storedName) {
  const objectPath = materialObjectPath(eventId, storedName);
  if (supabase) {
    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  try {
    return fs.readFileSync(path.join(dataDir, "uploads", eventId, storedName));
  } catch {
    return null;
  }
}

export async function removeMaterial(eventId, storedName) {
  const objectPath = materialObjectPath(eventId, storedName);
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (error) throw error;
    return;
  }
  await fs.promises.unlink(path.join(dataDir, "uploads", eventId, storedName)).catch(() => {});
}

export function publicEvent(event, { includeEmails = false } = {}) {
  if (!event) return null;
  return {
    id: event.id,
    name: event.name,
    mode: event.mode,
    dates: event.dates,
    weekdays: event.weekdays,
    hourStart: event.hourStart,
    hourEnd: event.hourEnd,
    timezone: event.timezone,
    durationMinutes: event.durationMinutes,
    createdAt: event.createdAt,
    pinnedSlot: event.pinnedSlot,
    hideReds: event.hideReds,
    managerName: event.managerName || "",
    people: event.people.map(({ name, hasPassword, joinedAt, email }) => ({
      name,
      hasPassword,
      joinedAt,
      hasEmail: Boolean(email),
      ...(includeEmails ? { email: email || "" } : {}),
    })),
    marks: event.marks,
    materials: Array.isArray(event.materials)
      ? event.materials.map(({ id, kind, title, url, note, filename, addedBy, addedAt }) => ({
        id, kind, title, url, note: note || "", filename: filename || "", addedBy, addedAt,
      }))
      : [],
  };
}
