import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TimeGrid from "../components/TimeGrid.jsx";
import { bestTimes, icsForPin } from "../lib/score.js";
import { eventSlots, formatSlotRange } from "../lib/slots.js";
import { DURATION_OPTIONS, emailDraft, isManager } from "../lib/event.js";

function sessionKey(id) {
  return `gtg:${id}`;
}

export default function EventPage({ id }) {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
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
            if (status === "green") delete mine[slot];
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

  useEffect(() => {
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(sessionKey(id)) || "null"); } catch { return null; }
    })();
    if (!saved?.name) return;
    fetch(`/api/events/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saved.name, password: saved.password || "", email: saved.email || "" }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          localStorage.removeItem(sessionKey(id));
          setMe(null);
          setError("Sign in again to edit your times.");
          return;
        }
        setMe(saved);
        setEvent(data.event);
      })
      .catch(() => {});
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
      if (color === "green") delete marks[me.name][slotId];
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
      body: JSON.stringify({ name, password, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    const session = { name: data.name, password, email };
    localStorage.setItem(sessionKey(id), JSON.stringify(session));
    setMe(session);
    setEvent(data.event);
  }

  function signOut() {
    localStorage.removeItem(sessionKey(id));
    setMe(null);
    setPassword("");
    setEmail("");
    setError("");
  }

  function startEditAs(personName) {
    setPreviewName(null);
    setName(personName);
    setError("");
  }

  async function patchEvent(body) {
    if (!me) return;
    const res = await fetch(`/api/events/${id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, name: me.name, password: me.password || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Only the manager can change this");
      return;
    }
    setEvent(data);
  }

  async function claimManager() {
    if (!me) return;
    const res = await fetch(`/api/events/${id}/claim-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: me.name, password: me.password || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not become manager");
      return;
    }
    setEvent(data);
  }

  async function emailGroup(kind) {
    if (!me) return;
    const res = await fetch(`/api/events/${id}/mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: me.name, password: me.password || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not prepare email");
      return;
    }
    const draft = emailDraft(
      { ...event, pinnedLabel: event.pinnedSlot ? formatSlotRange(event.pinnedSlot, event.durationMinutes, event) : "" },
      shareUrl,
      data.emails || [],
      kind,
    );
    if (!draft.count) {
      setError("No one has added an email yet. Ask people to sign in with an email, or copy the link.");
      return;
    }
    window.location.href = draft.mailto;
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

  const manager = isManager(event, me?.name);

  return (
    <main className="page event-page">
      <div className="event-head">
        <div>
          <h1>{event.name}</h1>
          <p className="lede">
            Times in {event.timezone}. Choose a status, then click a time box to set it.
            Default is available (green). You can come back and edit anytime.
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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional, so the manager can contact you)" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional password (so others cannot overwrite you)" />
              <button className="primary" type="submit">{event.people.some((p) => p.name === name.trim()) ? "Edit my times" : "Sign In"}</button>
              <p className="help">
                Everyone starts as available (green). Select a color, then click a box to change it.
                Sign in with the same name later to edit.
              </p>
            </form>
          ) : (
            <>
              <p className="signed">
                <span>
                  Editing as <strong>{me.name}</strong>
                  {manager ? " · manager" : ""}
                  {" — select a color, then click a box. Saves live."}
                </span>
                <button className="ghost" type="button" onClick={signOut}>Switch person</button>
              </p>
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
              <>
                {!me ? <p className="help">Click a name to preview, then sign in with that name to edit those times.</p> : null}
              <ul className="people">
                {event.people.map((p) => (
                  <li key={p.name}>
                    <button
                      className={previewName === p.name || me?.name === p.name ? "on" : ""}
                      onClick={() => {
                        if (me?.name === p.name) {
                          setPreviewName(null);
                          return;
                        }
                        if (!me) startEditAs(p.name);
                        setPreviewName(previewName === p.name ? null : p.name);
                      }}
                    >
                      {p.name}
                      {isManager(event, p.name) ? " · manager" : ""}
                      {me?.name === p.name ? " · you" : ""}
                      {p.hasPassword ? " · locked" : ""}
                    </button>
                  </li>
                ))}
              </ul>
              </>
            )}
          </section>
          <section className="panel best" style={{ marginTop: 16 }}>
            <h2>Best times</h2>
            {event.managerName ? <p className="help">Manager: {event.managerName}</p> : null}
            {me && !event.managerName ? (
              <button className="ghost" type="button" onClick={claimManager}>Become the manager</button>
            ) : null}
            <label className="field">
              <span>Meeting length</span>
              <select
                value={DURATION_OPTIONS.some((d) => d.value === event.durationMinutes) ? event.durationMinutes : 120}
                disabled={!manager}
                onChange={(e) => patchEvent({ durationMinutes: Number(e.target.value) })}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={event.hideReds}
                disabled={!manager}
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
                    {manager ? (
                      <div className="actions">
                        <button className="ghost" onClick={() => patchEvent({ pinnedSlot: s.startId })}>
                          {event.pinnedSlot === s.startId ? "Pinned" : "Pin"}
                        </button>
                      </div>
                    ) : null}
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
                {manager ? <button className="linkish" onClick={() => patchEvent({ pinnedSlot: null })}>Unpin</button> : null}
              </div>
            ) : null}
            {manager ? (
              <div className="mail-box">
                <h2>Email the group</h2>
                <p className="help">
                  Opens your email app with BCC. People must have entered an email when signing in.
                  No paid mail service is required.
                </p>
                <div className="actions">
                  <button className="ghost" type="button" onClick={() => emailGroup("invite")}>Email invite link</button>
                  <button className="ghost" type="button" disabled={!event.pinnedSlot} onClick={() => emailGroup("pinned")}>
                    Email proposed time
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
