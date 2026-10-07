import { useEffect, useMemo, useRef, useState } from "react";
import {
  STRANDS_COLS,
  STRANDS_EXTRAS,
  STRANDS_PUZZLES,
  STRANDS_ROWS,
  dailyIndex,
  dealStrandsPuzzle,
  strandsAdjacent,
  strandsHintPath,
  strandsLetter,
  strandsShare,
} from "../lib/chemistry-games.js";

const TOTAL = STRANDS_ROWS * STRANDS_COLS;

function cellClass(index, path, found, hinted) {
  const classes = ["strand-cell"];
  if (path.includes(index)) classes.push("on");
  if (found.spanagram?.includes(index)) classes.push("spanagram");
  else if (Object.values(found.theme).some((cells) => cells.includes(index))) classes.push("theme");
  if (hinted?.includes(index) && !classes.includes("theme") && !classes.includes("spanagram")) classes.push("hinted");
  return classes.join(" ");
}

export default function ChemStrands({ onBack }) {
  const [daily, setDaily] = useState(false);
  const [deal, setDeal] = useState(0);
  const [avoidId, setAvoidId] = useState("");
  const puzzle = useMemo(() => {
    if (daily) return STRANDS_PUZZLES[dailyIndex(STRANDS_PUZZLES.length, "strands")];
    return dealStrandsPuzzle(avoidId);
  }, [daily, deal, avoidId]);

  const [path, setPath] = useState([]);
  const [found, setFound] = useState({ theme: {}, spanagram: null });
  const [extras, setExtras] = useState([]);
  const [status, setStatus] = useState("Drag through adjacent letters.");
  const [hinted, setHinted] = useState(null);
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathRef = useRef([]);
  const dragging = useRef(false);

  const locked = useMemo(() => {
    const cells = new Set(found.spanagram || []);
    Object.values(found.theme).forEach((list) => list.forEach((cell) => cells.add(cell)));
    return cells;
  }, [found]);

  const themeLeft = puzzle.words.filter((word) => !found.theme[word]);
  const won = themeLeft.length === 0 && Boolean(found.spanagram);

  useEffect(() => {
    pathRef.current = [];
    setPath([]);
    setFound({ theme: {}, spanagram: null });
    setExtras([]);
    setHinted(null);
    setCopied(false);
    setStatus("Drag through adjacent letters. Theme words stay; other chemistry words earn hints.");
  }, [puzzle]);

  function updatePath(next) {
    pathRef.current = next;
    setPath(next);
  }

  function bump(message) {
    setStatus(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
  }

  function addCell(index) {
    if (index == null || locked.has(index)) return;
    const current = pathRef.current;
    if (!current.length) {
      updatePath([index]);
      return;
    }
    if (current.includes(index)) {
      if (current[current.length - 2] === index) updatePath(current.slice(0, -1));
      return;
    }
    if (!strandsAdjacent(current[current.length - 1], index)) return;
    updatePath([...current, index]);
  }

  function submitPath(cells) {
    if (cells.length < 4) {
      if (cells.length) bump("Need at least 4 letters.");
      updatePath([]);
      return;
    }
    const word = cells.map((index) => strandsLetter(puzzle.grid, index)).join("");
    if (word === puzzle.spanagram) {
      setFound((current) => ({ ...current, spanagram: cells }));
      updatePath([]);
      setHinted(null);
      setStatus(`Spanagram: ${word}.`);
      return;
    }
    if (puzzle.words.includes(word)) {
      if (found.theme[word]) {
        bump("Already found.");
        updatePath([]);
        return;
      }
      setFound((current) => ({ ...current, theme: { ...current.theme, [word]: cells } }));
      updatePath([]);
      setHinted(null);
      setStatus(`Theme word: ${word}.`);
      return;
    }
    if (STRANDS_EXTRAS.has(word)) {
      if (extras.includes(word)) bump("Already found.");
      else {
        const next = extras.length + 1;
        const toward = next % 3;
        setExtras((current) => [...current, word]);
        setStatus(toward === 0 ? `Extra word: ${word}. Hint ready.` : `Extra word: ${word}. ${3 - toward} more for a hint.`);
      }
      updatePath([]);
      return;
    }
    bump("Not a word in this lexicon.");
    updatePath([]);
  }

  function cellFromEvent(event) {
    const node = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-strand]");
    return node ? Number(node.dataset.strand) : null;
  }

  function hint() {
    if (extras.length < 3 || !themeLeft.length) return;
    const word = themeLeft[0];
    setHinted(strandsHintPath(puzzle, word, locked));
    setExtras((current) => current.slice(3));
    setStatus("Hint: those letters hide a theme word.");
  }

  async function copyShare() {
    const text = strandsShare(puzzle, extras.length);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function finishPointer() {
    if (!dragging.current) return;
    dragging.current = false;
    submitPath(pathRef.current);
  }

  function nextPuzzle() {
    setDaily(false);
    setAvoidId(puzzle.id);
    setDeal((n) => n + 1);
  }

  useEffect(() => {
    if (themeLeft.length === 0 && found.spanagram) {
      setStatus("Board complete. Every letter earned its keep.");
    }
  }, [found, themeLeft.length]);

  const currentWord = path.map((index) => strandsLetter(puzzle.grid, index)).join("");

  return (
    <section className="panel game-play">
      <p className="help">
        Lab Strands · {puzzle.words.length - themeLeft.length}/{puzzle.words.length} theme
        {found.spanagram ? " · spanagram" : ""} · extras {extras.length}
      </p>
      <h2>{puzzle.theme}</h2>
      <div className="game-options">
        <button type="button" className={`game-chip ${daily ? "on" : ""}`} onClick={() => { setDaily(true); setDeal((n) => n + 1); }}>Daily</button>
        <button type="button" className="game-chip" onClick={nextPuzzle}>New board</button>
      </div>
      <p className={`strand-word ${shake ? "shake" : ""}`}>{currentWord || " "}</p>
      <div
        className={`strand-grid ${shake ? "shake" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          const index = cellFromEvent(event);
          updatePath(index == null || locked.has(index) ? [] : [index]);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          addCell(cellFromEvent(event));
        }}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        {Array.from({ length: TOTAL }, (_, index) => (
          <button
            key={index}
            type="button"
            data-strand={index}
            className={cellClass(index, path, found, hinted)}
          >
            {strandsLetter(puzzle.grid, index)}
          </button>
        ))}
      </div>
      <p className="help" role="status">{status}</p>
      <div className="strand-found">
        {found.spanagram ? <span className="strand-tag spanagram">Spanagram · {puzzle.spanagram}</span> : null}
        {Object.keys(found.theme).map((word) => (
          <span className="strand-tag theme" key={word}>{word}</span>
        ))}
        {extras.map((word) => (
          <span className="strand-tag extra" key={word}>{word}</span>
        ))}
      </div>
      <div className="actions">
        <button className="primary" type="button" disabled={extras.length < 3 || !themeLeft.length || won} onClick={hint}>
          Hint ({Math.min(extras.length, 3)}/3)
        </button>
        {won ? (
          <>
            <button className="ghost" type="button" onClick={nextPuzzle}>Play again</button>
            <button className="ghost" type="button" onClick={copyShare}>{copied ? "Copied" : "Share"}</button>
          </>
        ) : null}
        <button className="ghost" type="button" onClick={onBack}>All games</button>
      </div>
    </section>
  );
}
