export const WEEKDAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toDateKey(dt);
}

export const SLOT_MINUTES = 30;
export const DEFAULT_SPAN_DAYS = 14;

export function defaultDates() {
  const start = toDateKey(new Date());
  return Array.from({ length: DEFAULT_SPAN_DAYS }, (_, i) => addDays(start, i));
}

export function minutesRange(hourStart, hourEnd) {
  const out = [];
  for (let h = hourStart; h < hourEnd; h++) {
    for (const m of [0, 30]) out.push({ hour: h, minute: m });
  }
  return out;
}

export function slotId(columnKey, hour, minute) {
  return `${columnKey}T${pad(hour)}:${pad(minute)}`;
}

export function parseSlot(id) {
  const [columnKey, time] = id.split("T");
  const [hour, minute] = time.split(":").map(Number);
  return { columnKey, hour, minute };
}

export function eventColumns(event) {
  if (event.mode === "weekdays") {
    return WEEKDAYS.filter((d) => event.weekdays.includes(d.id)).map((d) => ({
      key: `W${d.id}`,
      label: d.label,
      sub: "weekly",
    }));
  }
  return event.dates.map((dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      key: dateKey,
      label: dt.toLocaleDateString(undefined, { weekday: "short" }),
      sub: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
}

export function eventSlots(event) {
  const cols = eventColumns(event);
  const times = minutesRange(event.hourStart, event.hourEnd);
  const ids = [];
  for (const col of cols) {
    for (const t of times) ids.push(slotId(col.key, t.hour, t.minute));
  }
  return { cols, times, ids };
}

export function formatClock(hour, minute) {
  const dt = new Date(2000, 0, 1, hour, minute);
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatSlotRange(startId, durationMinutes, event) {
  const start = parseSlot(startId);
  const endMin = start.hour * 60 + start.minute + durationMinutes;
  const col = eventColumns(event).find((c) => c.key === start.columnKey);
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const day = col ? `${col.label} ${col.sub === "weekly" ? "" : col.sub}`.trim() : start.columnKey;
  return `${day} ${formatClock(start.hour, start.minute)}–${formatClock(endH, endM)}`;
}

export function hourOptions() {
  const out = [];
  for (let h = 0; h <= 24; h++) {
    out.push({
      value: h,
      label: h === 24 ? "12:00 AM (next day)" : formatClock(h, 0),
    });
  }
  return out;
}

export function timeZones() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "America/New_York", "Europe/London", "Asia/Jerusalem"];
  }
}

export function formatInZone(dateKey, hour, minute, eventTz, viewTz) {
  if (!eventTz || !viewTz || eventTz === viewTz || dateKey.startsWith("W")) return "";
  try {
    const asUtc = zonedToUtc(dateKey, hour, minute, eventTz);
    return new Intl.DateTimeFormat(undefined, {
      timeZone: viewTz,
      hour: "numeric",
      minute: "2-digit",
    }).format(asUtc);
  } catch {
    return "";
  }
}

function tzParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === 24 ? 0 : get("hour"),
    minute: get("minute"),
  };
}

function zonedToUtc(dateKey, hour, minute, timeZone) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d, hour, minute);
  const wanted = Date.UTC(y, m - 1, d, hour, minute);
  const asZone = tzParts(new Date(utc), timeZone);
  const asZoneMs = Date.UTC(asZone.year, asZone.month - 1, asZone.day, asZone.hour, asZone.minute);
  return new Date(wanted + (utc - asZoneMs));
}
