import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "events.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return { events: {} };
  }
}

function save(db) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(db));
}

let db = load();
let saveTimer = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(db), 200);
}

export function getEvent(id) {
  return db.events[id] || null;
}

export function createEvent(event) {
  db.events[event.id] = event;
  persist();
  return event;
}

export function updateEvent(id, fn) {
  const event = db.events[id];
  if (!event) return null;
  fn(event);
  persist();
  return event;
}

export function publicEvent(event) {
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
    people: event.people.map(({ name, hasPassword, joinedAt }) => ({
      name,
      hasPassword,
      joinedAt,
    })),
    marks: event.marks,
  };
}
