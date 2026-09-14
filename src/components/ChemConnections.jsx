import { useEffect, useMemo, useState } from "react";
import {
  CONNECTION_LIVES,
  CONNECTION_THEMES,
  FUN,
  connectionsShare,
  dealConnectionPuzzle,
  shuffle,
} from "../lib/chemistry-games.js";

const STATS_KEY = "gtg:connections";
const COLOR_RANK = { yellow: 0, green: 1, blue: 2, purple: 3 };

function sameSet(a, b) {
  return [...a].sort().join("\0") === [...b].sort().join("\0");
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; }
}

export default function ChemConnections({ onBack }) {
  const [theme, setTheme] = useState("any");
  const [livesMode, setLivesMode] = useState("classic");
  const [colorblind, setColorblind] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [deal, setDeal] = useState(0);
  const [avoidId, setAvoidId] = useState("");
  const maxLives = CONNECTION_LIVES.find((item) => item.id === livesMode)?.lives || 4;
  const puzzle = useMemo(() => dealConnectionPuzzle(theme, avoidId), [theme, deal, avoidId]);
  const [tiles, setTiles] = useState(puzzle.tiles);
  const [selected, setSelected] = useState([]);
  const [solved, setSolved] = useState([]);
  const [lives, setLives] = useState(maxLives);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState("Select four related terms.");
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(() => Number(loadStats().streak || 0));

  const remaining = tiles.filter((tile) => !solved.some((group) => group.items.includes(tile)));
  const lost = failed;
  const won = solved.length === 4 && !failed;
  const orderedSolved = [...solved].sort((a, b) => COLOR_RANK[a.color] - COLOR_RANK[b.color]);

  useEffect(() => {
    setTiles(puzzle.tiles);
    setSelected([]);
    setSolved([]);
    setLives(maxLives);
    setFailed(false);
    setCopied(false);
    setHintUsed(false);
    setStatus("Select four related terms. Yellow is gentler, purple is meaner.");
  }, [puzzle, maxLives]);

  function nextPuzzle() {
    setAvoidId(puzzle.id);
    setDeal((n) => n + 1);
  }

  function toggle(tile) {
    if (won || lost) return;
    if (solved.some((group) => group.items.includes(tile))) return;
    setSelected((current) => {
      if (current.includes(tile)) return current.filter((item) => item !== tile);
      if (current.length === 4) return current;
      return [...current, tile];
    });
  }

  function revealGroup() {
    if (won || lost || hintUsed) return;
    const leftover = puzzle.groups
      .filter((group) => !solved.some((item) => item.name === group.name))
      .sort((a, b) => COLOR_RANK[a.color] - COLOR_RANK[b.color]);
    const group = leftover[0];
    if (!group) return;
    const nextSolved = [...solved, group];
    setSolved(nextSolved);
    setSelected([]);
    setHintUsed(true);
    if (nextSolved.length === 4) {
      const nextStreak = Number(loadStats().streak || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify({ streak: nextStreak }));
      setStreak(nextStreak);
      setStatus(`Hint used. ${FUN.connWin}`);
    } else {
      setStatus(`Hint: ${group.name}.`);
    }
  }

  function submit() {
    if (selected.length !== 4 || won || lost) return;
    const match = puzzle.groups.find((group) => sameSet(group.items, selected));
    if (match) {
      const nextSolved = [...solved, match];
      setSolved(nextSolved);
      setSelected([]);
      if (nextSolved.length === 4) {
        const nextStreak = Number(loadStats().streak || 0) + 1;
        localStorage.setItem(STATS_KEY, JSON.stringify({ streak: nextStreak }));
        setStreak(nextStreak);
        setStatus(FUN.connWin);
      } else {
        setStatus(FUN.connYes(match.name));
      }
      return;
    }
    const almost = puzzle.groups.some((group) => selected.filter((item) => group.items.includes(item)).length === 3);
    const nextLives = lives - 1;
    setLives(nextLives);
    setShake(true);
    window.setTimeout(() => {
      setShake(false);
      setSelected([]);
    }, 420);
    if (nextLives === 0) {
      localStorage.setItem(STATS_KEY, JSON.stringify({ streak: 0 }));
      setStreak(0);
      setFailed(true);
      setSolved(puzzle.groups);
      setStatus("Out of lives. Here are the groups.");
      return;
    }
    setStatus(almost ? FUN.connAlmost[nextLives % FUN.connAlmost.length] : FUN.connNo[nextLives % FUN.connNo.length]);
  }

  useEffect(() => {
    if (autoSubmit && selected.length === 4) submit();
  }, [autoSubmit, selected]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
      if (event.key === "Escape") setSelected([]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function copyShare() {
    const text = connectionsShare(orderedSolved);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setStatus(text.replaceAll("\n", " · "));
    }
  }

  return (
    <section className="panel game-play">
      <p className="help">
        Lab Connections · {lives} / {maxLives} lives · {selected.length}/4 selected · streak {streak}
      </p>
      <h2>Find the chemistry groups</h2>
      <div className="game-options" role="group" aria-label="Connections options">
        {CONNECTION_THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`game-chip ${theme === item.id ? "on" : ""}`}
            onClick={() => { setTheme(item.id); nextPuzzle(); }}
          >
            {item.label}
          </button>
        ))}
        {CONNECTION_LIVES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`game-chip ${livesMode === item.id ? "on" : ""}`}
            onClick={() => { setLivesMode(item.id); nextPuzzle(); }}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className={`game-chip ${autoSubmit ? "on" : ""}`} onClick={() => setAutoSubmit((value) => !value)}>
          Auto-submit
        </button>
        <button type="button" className={`game-chip ${colorblind ? "on" : ""}`} onClick={() => setColorblind((value) => !value)}>
          Patterns
        </button>
      </div>
      <div className={`conn-solved ${colorblind ? "colorblind" : ""}`}>
        {orderedSolved.map((group) => (
          <div className={`conn-group conn-${group.color}`} key={group.name}>
            <strong>{group.name}</strong>
            <span>{group.items.join(", ")}</span>
          </div>
        ))}
      </div>
      {!won && !lost ? (
        <div className={`conn-grid ${shake ? "shake" : ""} ${colorblind ? "colorblind" : ""}`} role="group" aria-label="Ungrouped terms">
          {remaining.map((tile) => (
            <button
              key={tile}
              type="button"
              className={`conn-tile ${selected.includes(tile) ? "on" : ""}`}
              onClick={() => toggle(tile)}
            >
              {tile}
            </button>
          ))}
        </div>
      ) : null}
      <p className="help" role="status">{status}</p>
      <div className="conn-lives" aria-label={`${lives} lives left`}>
        {Array.from({ length: maxLives }, (_, i) => (
          <span key={i} className={`conn-life ${i < lives ? "on" : ""}`} />
        ))}
      </div>
      <div className="actions">
        {!won && !lost ? (
          <>
            <button className="primary" type="button" disabled={selected.length !== 4} onClick={submit}>Submit</button>
            <button className="ghost" type="button" onClick={() => setSelected([])}>Deselect</button>
            <button className="ghost" type="button" onClick={() => setTiles(shuffle(tiles))}>Shuffle</button>
            <button className="ghost" type="button" disabled={hintUsed} onClick={revealGroup}>Reveal a group</button>
            <button className="ghost" type="button" onClick={nextPuzzle}>Skip puzzle</button>
          </>
        ) : (
          <>
            <button className="primary" type="button" onClick={nextPuzzle}>Next puzzle</button>
            <button className="ghost" type="button" onClick={copyShare}>{copied ? "Copied" : "Share"}</button>
          </>
        )}
        <button className="ghost" type="button" onClick={onBack}>All games</button>
      </div>
    </section>
  );
}
