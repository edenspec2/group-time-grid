import { useEffect, useMemo, useRef } from "react";
import { heatColor, heatText, personStatus, slotBreakdown } from "../lib/score.js";
import { formatClock, formatInZone, slotId } from "../lib/slots.js";

export default function TimeGrid({
  event,
  cols,
  times,
  mode,
  myName,
  onPaint,
  previewName,
  hoverSlot,
  onHover,
}) {
  const gridRef = useRef(null);
  const painting = useRef(false);
  const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function colorFor(id) {
    if (mode === "mine") return personStatus(event.marks, myName, id);
    if (previewName) return personStatus(event.marks, previewName, id);
    return "";
  }

  function paintAt(clientX, clientY) {
    if (!onPaint) return;
    const el = document.elementFromPoint(clientX, clientY);
    const slot = el?.closest("[data-slot]")?.dataset.slot;
    if (slot) onPaint(slot);
  }

  useEffect(() => {
    function up() { painting.current = false; }
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const style = { gridTemplateColumns: `72px repeat(${cols.length}, var(--cell-w))` };
  const tip = useMemo(() => (hoverSlot && mode === "heat" && !previewName ? slotBreakdown(event, hoverSlot) : null), [event, hoverSlot, mode, previewName]);

  return (
    <div className="grid-wrap">
      <div
        className={`grid ${mode === "heat" && !previewName ? "heat" : ""}`}
        ref={gridRef}
        style={style}
        onPointerDown={(e) => {
          if (mode !== "mine") return;
          painting.current = true;
          gridRef.current?.setPointerCapture(e.pointerId);
          paintAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (mode === "mine" && painting.current) paintAt(e.clientX, e.clientY);
        }}
      >
        <div className="corner" />
        {cols.map((col) => (
          <div className="head" key={col.key}>
            {col.label}
            <small>{col.sub}</small>
          </div>
        ))}

        {times.map((t) => {
          const hourStart = t.minute === 0;
          const local = cols[0] && !String(cols[0].key).startsWith("W")
            ? formatInZone(cols[0].key, t.hour, t.minute, event.timezone, viewerTz)
            : "";
          return (
            <div key={`${t.hour}-${t.minute}`} style={{ display: "contents" }}>
              <div className={`time ${hourStart ? "hour" : ""}`}>
                {hourStart ? (
                  <>
                    {formatClock(t.hour, t.minute)}
                    {local && local !== formatClock(t.hour, t.minute) ? <span className="local">{local}</span> : null}
                  </>
                ) : null}
              </div>
              {cols.map((col) => {
                const id = slotId(col.key, t.hour, t.minute);
                const stats = slotBreakdown(event, id);
                const mine = colorFor(id);
                const heat = mode === "heat" && !previewName;
                const bg = heat ? heatColor(stats) : undefined;
                const fg = heat ? heatText(stats) : undefined;
                return (
                  <div
                    key={id}
                    data-slot={id}
                    className={`cell ${hourStart ? "hour" : ""} ${heat ? "" : mine} ${event.pinnedSlot === id ? "pinned" : ""}`}
                    style={heat ? { background: bg, color: fg } : undefined}
                    onPointerEnter={() => onHover?.(id)}
                    onPointerLeave={() => onHover?.(null)}
                  >
                    {heat && stats.total > 0 ? (
                      <>
                        <span className="count">{stats.green}/{stats.total}</span>
                        {stats.yellow > 0 ? <span className="plus">+{stats.yellow}</span> : null}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {tip ? (
        <div className="hover-card">
          <strong>{tip.green} of {tip.total} available</strong>
          {tip.who.green.length ? <div>Available: {tip.who.green.join(", ")}</div> : null}
          {tip.who.yellow.length ? <div>If needed: {tip.who.yellow.join(", ")}</div> : null}
          {tip.who.red.length ? <div>Cannot: {tip.who.red.join(", ")}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
