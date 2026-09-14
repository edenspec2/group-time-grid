import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FUN,
  WORDLE_GUESSES,
  WORDLE_HINTS,
  WORDLE_PACKS,
  hardModeError,
  pickWordleAnswer,
  scoreWordleGuess,
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
  const [round, setRound] = useState(0);
  const pack = WORDLE_PACKS.find((item) => item.id === packId) || WORDLE_PACKS[1];
  const answer = useMemo(() => pickWordleAnswer(pack, daily), [pack, daily, round]);
  const [rows, setRows] = useState([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState("");
  const [ended, setEnded] = useState("");
  const [hint, setHint] = useState("");
  const [streak, setStreak] = useState(() => Number(loadStats().streak || 0));

  const letters = pack.letters;

  function resetBoard() {
    setRows([]);
    setCurrent("");
    setStatus(daily ? "Today's flask. Same word for everyone." : `Guess a ${letters}-letter chemistry word.`);
    setEnded("");
    setHint("");
  }

  useEffect(() => {
    resetBoard();
  }, [answer, letters, daily]);

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
      setStatus(`Need ${letters} letters.`);
      return;
    }
    if (!WORDLE_GUESSES.has(guess) || guess.length !== letters) {
      setStatus("Not in the chemistry word list.");
      return;
    }
    if (hard) {
      const hardError = hardModeError(guess, rows);
      if (hardError) {
        setStatus(hardError);
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
    } else if (nextRows.length >= 6) {
      localStorage.setItem(STATS_KEY, JSON.stringify({ streak: 0 }));
      setStreak(0);
      setEnded("lost");
      setStatus(FUN.wordleLose(answer));
    } else {
      setStatus(`${6 - nextRows.length} left.`);
    }
  }, [answer, ended, hard, letters, rows]);

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

  const colors = letterColors(rows);
  const empties = 6 - rows.length - (ended ? 0 : 1);

  return (
    <section className="panel game-play">
      <p className="help">Chemle · {pack.label} · {letters} letters · streak {streak}</p>
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
      </div>
      <div className="wordle-board" style={{ "--letters": letters, width: `min(${letters * 52}px, 100%)` }} aria-label="Guesses">
        {rows.map((row, i) => (
          <div className="wordle-row" key={`g-${i}`}>
            {row.letters.map((letter, j) => (
              <span className={`wordle-cell wordle-${row.tones[j]}`} key={`${letter}-${j}`}>{letter}</span>
            ))}
          </div>
        ))}
        {!ended && rows.length < 6 ? (
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
      <p className="help" role="status">{status}{hint ? ` ${hint}` : ""}</p>
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
          <button className="primary" type="button" onClick={playAgain}>Play again</button>
        )}
        <button className="ghost" type="button" onClick={onBack}>All games</button>
      </div>
    </section>
  );
}
