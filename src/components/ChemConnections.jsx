import { useEffect, useMemo, useState } from "react";
import {
  CONNECTION_LIVES,
  CONNECTION_THEMES,
  FUN,
  dealConnectionPuzzle,
  shuffle,
} from "../lib/chemistry-games.js";

const STATS_KEY = "gtg:connections";

function sameSet(a, b) {
  return [...a].sort().join("\0") === [...b].sort().join("\0");
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; }
}

export default function ChemConnections({ onBack }) {
  const [theme, setTheme] = useState("any");
  const [livesMode, setLivesMode] = useState("classic");
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
  const [streak, setStreak] = useState(() => Number(loadStats().streak || 0));

  const remaining = tiles.filter((tile) => !solved.some((group) => group.items.includes(tile)));
  const lost = failed;
  const won = solved.length === 4 && !failed;

  useEffect(() => {
    setTiles(puzzle.tiles);
    setSelected([]);
    setSolved([]);
    setLives(maxLives);
    setFailed(false);
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
    if (nextLives === 0) {
      localStorage.setItem(STATS_KEY, JSON.stringify({ streak: 0 }));
      setStreak(0);
      setSelected([]);
      setFailed(true);
      setSolved(puzzle.groups);
      setStatus("Out of lives. Here are the groups.");
      return;
    }
    setStatus(almost ? FUN.connAlmost[nextLives % FUN.connAlmost.length] : FUN.connNo[nextLives % FUN.connNo.length]);
  }

  return (
    <section className="panel game-play">
      <p className="help">
        Lab Connections · {maxLives} {maxLives === 1 ? "life" : "lives"} · {lives} left · streak {streak}
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
      </div>
      <div className="conn-solved">
        {solved.map((group) => (
          <div className={`conn-group conn-${group.color}`} key={group.name}>
            <strong>{group.name}</strong>
            <span>{group.items.join(", ")}</span>
          </div>
        ))}
      </div>
      {!won && !lost ? (
        <div className="conn-grid" role="group" aria-label="Ungrouped terms">
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
            <button className="ghost" type="button" onClick={nextPuzzle}>Skip puzzle</button>
          </>
        ) : (
          <button className="primary" type="button" onClick={nextPuzzle}>Next puzzle</button>
        )}
        <button className="ghost" type="button" onClick={onBack}>All games</button>
      </div>
    </section>
  );
}
