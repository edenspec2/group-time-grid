export function personStatus(marks, name, slotId) {
  return marks?.[name]?.[slotId] || "red";
}

export function slotBreakdown(event, slotId) {
  const people = event.people || [];
  const who = { green: [], yellow: [], red: [] };
  for (const person of people) {
    who[personStatus(event.marks, person.name, slotId)].push(person.name);
  }
  const green = who.green.length;
  const yellow = who.yellow.length;
  const red = who.red.length;
  const total = people.length;
  const score = green * 2 + yellow;
  const max = total * 2;
  return { who, green, yellow, red, total, score, max };
}

export function heatColor(stats) {
  if (!stats.total) return "#f4f4f5";
  if (stats.green === 0 && stats.yellow === 0) return "#fecaca";
  const t = stats.max ? stats.score / stats.max : 0;
  if (t >= 0.75) return "#16a34a";
  if (t >= 0.5) return "#4ade80";
  if (t >= 0.3) return "#facc15";
  return "#fde68a";
}

export function heatText(stats) {
  if (!stats.total) return "#71717a";
  if (stats.green === 0 && stats.yellow === 0) return "#7f1d1d";
  const t = stats.max ? stats.score / stats.max : 0;
  return t >= 0.5 ? "#052e16" : "#713f12";
}

function consecutiveIds(startId, slotCount, cols, times) {
  const [columnKey, time] = startId.split("T");
  const [hour, minute] = time.split(":").map(Number);
  const startIndex = times.findIndex((t) => t.hour === hour && t.minute === minute);
  if (startIndex < 0 || startIndex + slotCount > times.length) return null;
  const ids = [];
  for (let i = 0; i < slotCount; i++) {
    const t = times[startIndex + i];
    ids.push(`${columnKey}T${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`);
  }
  if (!cols.some((c) => c.key === columnKey)) return null;
  return ids;
}

export function bestTimes(event, cols, times) {
  if (!event.people?.length) return [];
  const slotCount = Math.max(1, Math.round((event.durationMinutes || 60) / 15));
  const candidates = [];

  for (const col of cols) {
    for (let i = 0; i <= times.length - slotCount; i++) {
      const start = times[i];
      const startId = `${col.key}T${String(start.hour).padStart(2, "0")}:${String(start.minute).padStart(2, "0")}`;
      const ids = consecutiveIds(startId, slotCount, cols, times);
      if (!ids) continue;

      const parts = ids.map((id) => slotBreakdown(event, id));
      const greenMin = Math.min(...parts.map((p) => p.green));
      const yellowMax = Math.max(...parts.map((p) => p.yellow));
      const redMax = Math.max(...parts.map((p) => p.red));
      const score = parts.reduce((s, p) => s + p.score, 0);
      const greenNames = new Set(parts.flatMap((p) => p.who.green));
      const yellowNames = new Set(parts.flatMap((p) => p.who.yellow));
      const redNames = new Set(parts.flatMap((p) => p.who.red));

      if (event.hideReds && redMax > 0) continue;

      candidates.push({
        startId,
        ids,
        score,
        green: greenMin,
        yellow: yellowMax,
        red: redMax,
        total: event.people.length,
        greenNames: [...greenNames],
        yellowNames: [...yellowNames],
        redNames: [...redNames],
      });
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.red !== b.red) return a.red - b.red;
    if (a.yellow !== b.yellow) return a.yellow - b.yellow;
    return a.startId.localeCompare(b.startId);
  });

  return candidates.slice(0, 3);
}

function icsStamp(dateKey, hour, minute) {
  const compactDate = dateKey.replace(/-/g, "");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${compactDate}T${hh}${mm}00`;
}

export function icsForPin(event, startId) {
  const duration = event.durationMinutes || 60;
  const [columnKey, time] = startId.split("T");
  const [hour, minute] = time.split(":").map(Number);
  const endMin = hour * 60 + minute + duration;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const summary = event.name.replace(/[,\\;]/g, " ");
  const tz = (event.timezone || "UTC").replace(/[:]/g, "");
  const timed = !columnKey.startsWith("W");
  const start = timed ? icsStamp(columnKey, hour, minute) : "";
  const end = timed ? icsStamp(columnKey, Math.floor(endMin / 60), endMin % 60) : "";
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Group Time Grid//EN
BEGIN:VEVENT
UID:${event.id}-${startId}@group-time-grid
DTSTAMP:${stamp}
SUMMARY:${summary}
${timed ? `DTSTART;TZID=${tz}:${start}\nDTEND;TZID=${tz}:${end}` : `DESCRIPTION:Weekly slot ${startId} for ${duration} minutes.`}
END:VEVENT
END:VCALENDAR`;
}
