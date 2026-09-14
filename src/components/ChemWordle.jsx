import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FUN,
  WORDLE_GUESS_OPTIONS,
  WORDLE_HINTS,
  WORDLE_PACKS,
  hardModeError,
  pickWordleAnswer,
  scoreWordleGuess,
  wordleShare,
} from "../lib/chemistry-games.js";

const KEYS = ["QWERTYUIOP".split(""), "ASDFGHJKL".split(""), ["Enter", ..."ZXCVBNM".split(""), "⌫"]];
const STATS_KEY = "gtg:chemle";

function letterColors(rows) {
  const colors = {};
  const rank = { absent: 1, present: 2, correct: 3 };
  for (const row of rows) {
    row.letters.forEach((letter, i) => {
      const tone = row.tones[i];
      if (!colors[letter] || rank[tone] > rank[colors[letter]]) colors[letter] = tone;
    });
  }
  return colors;
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; }
}

export default function ChemWordle({ onBack }) {
  const [packId, setPackId] = useState("classic");
  const [daily, setDaily] = useState(false);
  const [hard, setHard] = useState(false);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [contrast, setContrast] = useState(false);
  const [showFirst, setShowFirst] = useState(false);
  const [round, setRound] = useState(0);
  const pack = WORDLE_PACKS.find((item) => item.id === packId) || WORDLE_PACKS[1];
  const answer = useMemo(() => pickWordleAnswer(pack, daily), [pack, daily, round]);
  const [rows, setRows] = useState([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState("");
  const [ended, setEnded] = useState("");
  const [hint, setHint] = useState("");
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(() => Number(loadStats().streak || 0));
  const letters = pack.letters;

  useEffect(() => {
    setRows([]);
    setCurrent("");
    setStatus(daily
      ? "Today's flask. Type any letters — the hidden word is chemistry."
      : `Any ${letters}-letter word is allowed. The answer is chemistry.`);
    setEnded("");
    setHint("");
    setCopied(false);
  }, [answer, letters, daily]);

  function bump(message) {
    setStatus(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
  }

  function changePack(id) {
    setPackId(id);
    setDaily(false);
    setRound((n) => n + 1);
  }

  function playAgain() {
    if (daily) setDaily(false);
    setRound((n) => n + 1);
  }

  const submit = useCallback((word) => {
    if (ended) return;
    const guess = word.toUpperCase();
    if (guess.length !== letters) {
      bump(`Need ${letters} letters.`);
      return;
    }
    if (rows.some((row) => row.letters.join("") === guess)) {
      bump("Already tried that.");
      return;
    }
    if (hard) {
      const hardError = hardModeError(guess, rows);
      if (hardError) {
        bump(hardError);
        return;
      }
    }
    const tones = scoreWordleGuess(guess, answer);
    const nextRows = [...rows, { letters: guess.split(""), tones }];
    setRows(nextRows);
    setCurrent("");
    if (guess === answer) {
      const nextStreak = Number(loadStats().streak || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify({ streak: nextStreak }));
      setStreak(nextStreak);
      setEnded("won");
      setStatus(FUN.wordleWin(nextRows.length));
    } else if (nextRows.length >= maxGuesses) {
      localStorage.setItem(STATS_KEY, JSON.stringify({ streak: 0 }));
      setStreak(0);
      setEnded("lost");
      setStatus(FUN.wordleLose(answer));
    } else {
      setStatus(`${maxGuesses - nextRows.length} left. Any word is fine.`);
    }
  }, [answer, ended, hard, letters, maxGuesses, rows]);

  const typeLetter = useCallback((key) => {
    if (ended) return;
    if (key === "Enter") {
      submit(current);
      return;
    }
    if (key === "Backspace" || key === "⌫") {
      setCurrent((value) => value.slice(0, -1));
      return;
    }
    if (/^[a-zA-Z]$/.test(key) && current.length < letters) {
      setCurrent((value) => (value + key).toUpperCase());
    }
  }, [current, ended, letters, submit]);

  useEffect(() => {
    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter" || event.key === "Backspace" || /^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        typeLetter(event.key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeLetter]);

  async function copyShare() {
    const text = wordleShare(rows, ended === "won", maxGuesses);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setStatus(text.replaceAll("\n", " · "));
    }
  }

  const colors = letterColors(rows);
  const empties = maxGuesses - rows.length - (ended ? 0 : 1);

  return (
    <section className="panel game-play">
      <p className="help">Chemle · {pack.label} · {letters} letters · {maxGuesses} guesses · streak {streak}</p>
      <h2>{daily ? "Today's word" : "Guess the word"}</h2>
      <div className="game-options" role="group" aria-label="Chemle options">
        {WORDLE_PACKS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`game-chip ${packId === item.id && !daily ? "on" : ""}`}
            onClick={() => changePack(item.id)}
          >
            {item.label} · {item.letters}
          </button>
        ))}
        {WORDLE_GUESS_OPTIONS.map((count) => (
          <button
            key={count}
            type="button"
            className={`game-chip ${maxGuesses === count ? "on" : ""}`}
            onClick={() => { setMaxGuesses(count); setRound((n) => n + 1); }}
          >
            {count} guesses
          </button>
        ))}
        <button
          type="button"
          className={`game-chip ${daily ? "on" : ""}`}
          onClick={() => { setDaily(true); setPackId("classic"); setRound((n) => n + 1); }}
        >
          Daily
        </button>
        <button type="button" className={`game-chip ${hard ? "on" : ""}`} onClick={() => setHard((value) => !value)}>
          Hard mode
        </button>
        <button type="button" className={`game-chip ${showFirst ? "on" : ""}`} onClick={() => setShowFirst((value) => !value)}>
          First letter
        </button>
        <button type="button" className={`game-chip ${contrast ? "on" : ""}`} onClick={() => setContrast((value) => !value)}>
          High contrast
        </button>
      </div>
      <div
        className={`wordle-board ${shake ? "shake" : ""} ${contrast ? "high-contrast" : ""}`}
        style={{ "--letters": letters, width: `min(${letters * 52}px, 100%)` }}
        aria-label="Guesses"
      >
        {rows.map((row, i) => (
          <div className="wordle-row" key={`g-${i}`}>
            {row.letters.map((letter, j) => (
              <span className={`wordle-cell wordle-${row.tones[j]}`} data-tone={row.tones[j]} key={`${letter}-${j}`}>{letter}</span>
            ))}
          </div>
        ))}
        {!ended && rows.length < maxGuesses ? (
          <div className="wordle-row">
            {Array.from({ length: letters }, (_, i) => (
              <span className={`wordle-cell ${current[i] ? "wordle-typed" : "wordle-empty"}`} key={`c-${i}`}>
                {current[i] || ""}
              </span>
            ))}
          </div>
        ) : null}
        {Array.from({ length: Math.max(0, empties) }, (_, i) => (
          <div className="wordle-row" key={`e-${i}`}>
            {Array.from({ length: letters }, (_, j) => <span className="wordle-cell wordle-empty" key={j} />)}
          </div>
        ))}
      </div>
      <p className="help" role="status">
        {showFirst ? `Starts with ${answer[0]}. ` : ""}
        {status}
        {hint ? ` ${hint}` : ""}
      </p>
      <div className="wordle-keys">
        {KEYS.map((row, i) => (
          <div className="wordle-key-row" key={i}>
            {row.map((key) => (
              <button
                key={key}
                type="button"
                className={`wordle-key ${key.length > 1 ? "wide" : ""} ${colors[key] ? `wordle-${colors[key]}` : ""}`}
                onClick={() => typeLetter(key === "⌫" ? "Backspace" : key)}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="actions">
        {!ended ? (
          <>
            <button
              className="ghost"
              type="button"
              disabled={Boolean(hint)}
              onClick={() => setHint(WORDLE_HINTS[answer] || `A ${pack.blurb.toLowerCase()} word.`)}
            >
              Hint
            </button>
            {rows.length >= 2 ? (
              <button className="ghost" type="button" onClick={() => {
                localStorage.setItem(STATS_KEY, JSON.stringify({ streak: 0 }));
                setStreak(0);
                setEnded("lost");
                setStatus(FUN.wordleLose(answer));
              }}>
                Reveal
              </button>
            ) : null}
          </>
        ) : (
          <>
            <button className="primary" type="button" onClick={playAgain}>Play again</button>
            <button className="ghost" type="button" onClick={copyShare}>{copied ? "Copied" : "Share"}</button>
          </>
        )}
        <button className="ghost" type="button" onClick={onBack}>All games</button>
      </div>
    </section>
  );
}
