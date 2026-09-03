import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TimeGrid from "../components/TimeGrid.jsx";
import { bestTimes, icsForPin } from "../lib/score.js";
import { eventSlots, formatSlotRange } from "../lib/slots.js";

function sessionKey(id) {
  return `gtg:${id}`;
}

export default function EventPage({ id }) {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(() => {
    try { return JSON.parse(localStorage.getItem(sessionKey(id)) || "null"); } catch { return null; }
  });
  const [color, setColor] = useState("green");
  const [previewName, setPreviewName] = useState(null);
  const [hoverSlot, setHoverSlot] = useState(null);
  const [live, setLive] = useState("connecting");
  const [copied, setCopied] = useState(false);
  const pending = useRef({});
  const flushTimer = useRef(null);
  const wsRef = useRef(null);
  const meRef = useRef(me);
  meRef.current = me;

  const { cols, times } = useMemo(() => (event ? eventSlots(event) : { cols: [], times: [] }), [event]);
  const suggestions = useMemo(() => (event ? bestTimes(event, cols, times) : []), [event, cols, times]);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Not found");
        if (!cancelled) setEvent(data);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}/ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      setLive("live");
      ws.send(JSON.stringify({ type: "subscribe", eventId: id }));
    };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "state") {
        setEvent(() => {
          const next = msg.event;
          const session = meRef.current;
          const queued = pending.current;
          if (!session || !Object.keys(queued).length) return next;
          const mine = { ...(next.marks[session.name] || {}) };
          for (const [slot, status] of Object.entries(queued)) {
            if (status === "red") delete mine[slot];
            else mine[slot] = status;
          }
          return { ...next, marks: { ...next.marks, [session.name]: mine } };
        });
      }
      if (msg.type === "error") setError(msg.error);
    };
    ws.onclose = () => setLive("offline");
    ws.onerror = () => setLive("offline");
    return () => ws.close();
  }, [id]);

  const flush = useCallback(() => {
    const updates = pending.current;
    pending.current = {};
    const session = meRef.current;
    if (!session || !Object.keys(updates).length) return;
    const payload = {
      type: "paint",
      eventId: id,
      name: session.name,
      password: session.password || "",
      updates,
    };
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(payload));
      return;
    }
    fetch(`/api/events/${id}/paint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => res.json()).then((data) => { if (data.id) setEvent(data); }).catch(() => {});
  }, [id]);

  function queuePaint(slotId) {
    if (!me) return;
    pending.current[slotId] = color;
    setEvent((cur) => {
      if (!cur) return cur;
      const marks = { ...cur.marks, [me.name]: { ...(cur.marks[me.name] || {}) } };
      if (color === "red") delete marks[me.name][slotId];
      else marks[me.name][slotId] = color;
      return { ...cur, marks };
    });
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 40);
  }

  async function join(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/events/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    const session = { name: data.name, password };
    localStorage.setItem(sessionKey(id), JSON.stringify(session));
    setMe(session);
    setEvent(data.event);
  }

  async function patchEvent(body) {
    const res = await fetch(`/api/events/${id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) setEvent(data);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadIcs() {
    if (!event?.pinnedSlot) return;
    const blob = new Blob([icsForPin(event, event.pinnedSlot)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${event.name}.ics`;
    a.click();
  }

  if (error && !event) {
    return <main className="page"><p className="error">{error}</p></main>;
  }
  if (!event) return <main className="page"><p>Loading…</p></main>;

  return (
    <main className="page event-page">
      <div className="event-head">
        <div>
          <h1>{event.name}</h1>
          <p className="lede">
            Times in {event.timezone}. Green = available, yellow = if needed, red = cannot.
            Numbers on the group grid are how many people marked that box available.
          </p>
        </div>
        <div className="share">
          <code>{shareUrl}</code>
          <button className="ghost" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
        </div>
      </div>

      <div className="layout">
        <section className="panel">
          <h2>Your Availability</h2>
          {!me ? (
            <form className="sign" onSubmit={join}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sign in as (your name)" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional password (so others cannot overwrite you)" />
            <button className="primary" type="submit">Sign In</button>
              <p className="help">The grid starts red. Drag green or yellow over times that could work.</p>
            </form>
          ) : (
            <>
              <p className="signed">Signed in as <strong>{me.name}</strong></p>
              <div className="palette">
                {[
                  ["green", "Available", "g"],
                  ["yellow", "If needed", "y"],
                  ["red", "Cannot", "r"],
                ].map(([id, label, cls]) => (
                  <button key={id} className={`${cls} ${color === id ? "sel" : ""}`} onClick={() => setColor(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="legend">
                <span><i className="swatch" style={{ background: "#22c55e" }} /> available</span>
                <span><i className="swatch" style={{ background: "#eab308" }} /> if needed</span>
                <span><i className="swatch" style={{ background: "#ef4444" }} /> cannot</span>
              </div>
              <TimeGrid
                event={event}
                cols={cols}
                times={times}
                mode="mine"
                myName={me.name}
                paintColor={color}
                onPaint={queuePaint}
              />
            </>
          )}
          <p className={`status ${live === "live" ? "" : "off"}`}>
            {live === "live" ? "Live — updates for everyone" : "Offline — reconnecting or changes will sync when back"}
          </p>
          {error ? <p className="error">{error}</p> : null}
        </section>

        <section className="panel">
          <h2>Group's Availability</h2>
          <p className="count-note">
            Each box shows <strong>how many people picked that time as available</strong>
            {event.people.length ? ` (out of ${event.people.length} signed in)` : ""}.
            Darker green means more overlap. Hover a box for names.
          </p>
          {previewName ? <p className="help">Viewing {previewName}. Click their name again to return to the group counts.</p> : null}
          <TimeGrid
            event={event}
            cols={cols}
            times={times}
            mode="heat"
            previewName={previewName}
            hoverSlot={hoverSlot}
            onHover={setHoverSlot}
          />
        </section>

        <aside>
          <section className="panel">
            <h2>People ({event.people.length})</h2>
            {event.people.length === 0 ? <p className="help">Share the link so people can sign in.</p> : (
              <ul className="people">
                {event.people.map((p) => (
                  <li key={p.name}>
                    <button className={previewName === p.name ? "on" : ""} onClick={() => setPreviewName(previewName === p.name ? null : p.name)}>
                      {p.name}{p.hasPassword ? " · locked" : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel best" style={{ marginTop: 16 }}>
            <h2>Best times</h2>
            <label className="field">
              <span>Meeting length</span>
              <select
                value={event.durationMinutes}
                onChange={(e) => patchEvent({ durationMinutes: Number(e.target.value) })}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={event.hideReds}
                onChange={(e) => patchEvent({ hideReds: e.target.checked })}
              />
              Hide times anyone marked cannot
            </label>
            {suggestions.length === 0 ? (
              <p className="help">{event.people.length ? "No overlapping block yet." : "Waiting for people to sign in."}</p>
            ) : (
              <ol>
                {suggestions.map((s) => (
                  <li key={s.startId}>
                    <div>{formatSlotRange(s.startId, event.durationMinutes, event)}</div>
                    <div className="meta">
                      {s.green} of {s.total} available
                      {s.yellow ? ` · ${s.yellow} if needed` : ""}
                      {s.red ? ` · ${s.red} cannot` : ""}
                    </div>
                    <div className="actions">
                      <button className="ghost" onClick={() => patchEvent({ pinnedSlot: s.startId })}>
                        {event.pinnedSlot === s.startId ? "Pinned" : "Pin"}
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {event.pinnedSlot ? (
              <div className="actions">
                <button className="ghost" onClick={() => navigator.clipboard.writeText(formatSlotRange(event.pinnedSlot, event.durationMinutes, event))}>
                  Copy pinned time
                </button>
                <button className="ghost" onClick={downloadIcs}>Download .ics</button>
                <button className="linkish" onClick={() => patchEvent({ pinnedSlot: null })}>Unpin</button>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
