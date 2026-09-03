import { useMemo, useRef, useState } from "react";
import { defaultDates, hourOptions, timeZones, toDateKey, WEEKDAYS } from "../lib/slots.js";

function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array(start).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

function Calendar({ selected, onChange }) {
  const now = new Date();
  const wrapRef = useRef(null);
  const drag = useRef(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const months = [
    { y: now.getFullYear(), m: now.getMonth() },
    { y: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), m: (now.getMonth() + 1) % 12 },
  ];

  function apply(dateKey, mode) {
    const next = new Set(selectedRef.current);
    if (mode === "add") next.add(dateKey);
    else next.delete(dateKey);
    onChange([...next].sort());
  }

  function dateFromPoint(x, y) {
    return document.elementFromPoint(x, y)?.closest("[data-date]")?.dataset.date;
  }

  return (
    <div
      className="months"
      ref={wrapRef}
      onPointerDown={(e) => {
        const key = dateFromPoint(e.clientX, e.clientY);
        if (!key) return;
        e.preventDefault();
        wrapRef.current?.setPointerCapture(e.pointerId);
        drag.current = selectedRef.current.includes(key) ? "remove" : "add";
        apply(key, drag.current);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const key = dateFromPoint(e.clientX, e.clientY);
        if (key) apply(key, drag.current);
      }}
      onPointerUp={() => { drag.current = null; }}
    >
      {months.map(({ y, m }) => (
        <div className="month" key={`${y}-${m}`}>
          <h3>{new Date(y, m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
          <div className="cal">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div className="dow" key={i}>{d}</div>
            ))}
            {monthMatrix(y, m).map((date, i) => (
              <button
                type="button"
                key={i}
                data-date={date ? toDateKey(date) : undefined}
                className={`day ${date ? "" : "empty"} ${date && selected.includes(toDateKey(date)) ? "on" : ""}`}
                disabled={!date}
              >
                {date ? date.getDate() : ""}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CreateEvent({ onCreated }) {
  const hours = useMemo(hourOptions, []);
  const zones = useMemo(timeZones, []);
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [name, setName] = useState("");
  const [mode, setMode] = useState("dates");
  const [dates, setDates] = useState(defaultDates);
  const [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5]);
  const [hourStart, setHourStart] = useState(9);
  const [hourEnd, setHourEnd] = useState(17);
  const [timezone, setTimezone] = useState(browserTz);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleWeek(id) {
    setWeekdays((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].sort()));
  }

  async function create() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          name,
          mode,
          dates,
          weekdays,
          hourStart: Number(hourStart),
          hourEnd: Number(hourEnd),
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create event");
      onCreated(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <form onSubmit={(e) => { e.preventDefault(); create(); }}>
      <h1>Plan a new event</h1>
      <p className="lede">
        Pick possible dates and hours. Everyone opens the same link, paints green / yellow / red,
        and the group grid shows how many people can make each slot.
      </p>

      <input
        className="event-name"
        placeholder="New Event Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="create-grid">
        <section className="panel">
          <h2>What dates might work?</h2>
          <p className="help">Click and drag dates to choose possibilities.</p>
          <label className="field">
            <span>Survey using</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="dates">Specific Dates</option>
              <option value="weekdays">Days of the Week</option>
            </select>
          </label>
          {mode === "dates" ? (
            <Calendar selected={dates} onChange={setDates} />
          ) : (
            <>
              <p className="help">Days of the week uses one shared timezone for everyone.</p>
              <div className="weekdays">
                {WEEKDAYS.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    className={weekdays.includes(d.id) ? "on" : ""}
                    onClick={() => toggleWeek(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <h2>What times might work?</h2>
          <label className="field">
            <span>No earlier than</span>
            <select value={hourStart} onChange={(e) => setHourStart(Number(e.target.value))}>
              {hours.filter((h) => h.value < 24).map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>No later than</span>
            <select value={hourEnd} onChange={(e) => setHourEnd(Number(e.target.value))}>
              {hours.filter((h) => h.value > hourStart).map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Time zone</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </label>
          <div className="ready">
            <span>Ready?</span>
            <button className="primary" type="submit" disabled={busy || !name.trim()}>
              Create Event
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </section>
      </div>
      </form>
    </main>
  );
}
