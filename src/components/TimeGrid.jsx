import { useMemo, useRef } from "react";
import { heatColor, heatText, personStatus, slotBreakdown } from "../lib/score.js";
import { formatClock, formatInZone, parseSlot, slotId } from "../lib/slots.js";

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
  const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function colorFor(id) {
    if (mode === "mine") return personStatus(event.marks, myName, id);
    if (previewName) return personStatus(event.marks, previewName, id);
    return "";
  }

  const style = { gridTemplateColumns: `72px repeat(${cols.length}, var(--cell-w))` };
  const tip = useMemo(() => (hoverSlot && mode === "heat" && !previewName ? slotBreakdown(event, hoverSlot) : null), [event, hoverSlot, mode, previewName]);
  const pinnedSlots = useMemo(() => {
    const pinned = new Set();
    if (!event.pinnedSlot) return pinned;
    try {
      const start = parseSlot(event.pinnedSlot);
      const startIndex = times.findIndex((time) => time.hour === start.hour && time.minute === start.minute);
      const count = Math.round((event.durationMinutes || 120) / 30);
      if (startIndex < 0 || !cols.some((column) => column.key === start.columnKey)) return pinned;
      for (let index = startIndex; index < Math.min(startIndex + count, times.length); index++) {
        pinned.add(slotId(start.columnKey, times[index].hour, times[index].minute));
      }
    } catch {
      // Ignore invalid legacy pins instead of breaking the event page.
    }
    return pinned;
  }, [cols, event.durationMinutes, event.pinnedSlot, times]);

  return (
    <div className="grid-wrap">
      <div
        className={`grid ${mode === "heat" && !previewName ? "heat" : ""}`}
        ref={gridRef}
        style={style}
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
                {formatClock(t.hour, t.minute)}
                {local && local !== formatClock(t.hour, t.minute) ? <span className="local">{local}</span> : null}
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
                    className={`cell ${hourStart ? "hour" : ""} ${heat ? "" : mine} ${pinnedSlots.has(id) ? "pinned" : ""}`}
                    style={heat ? { background: bg, color: fg } : undefined}
                    role={mode === "mine" ? "button" : undefined}
                    tabIndex={mode === "mine" ? 0 : undefined}
                    aria-label={mode === "mine" ? `${col.label} ${col.sub} ${formatClock(t.hour, t.minute)}: ${mine}` : undefined}
                    onClick={() => {
                      if (mode === "mine") onPaint?.(id);
                    }}
                    onKeyDown={(event) => {
                      if (mode === "mine" && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        onPaint?.(id);
                      }
                    }}
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
