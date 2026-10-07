import { useState } from "react";
import ChemConnections from "../components/ChemConnections.jsx";
import ChemStrands from "../components/ChemStrands.jsx";
import ChemWordle from "../components/ChemWordle.jsx";

const MENU = [
  {
    id: "wordle",
    title: "Chemle",
    blurb: "Guess the hidden chemistry word. Any letters are allowed — the answer is still from the lab lexicon.",
    meta: "4–7 letters · 4/6/8 guesses · daily · hard mode",
    preview: "wordle",
  },
  {
    id: "connections",
    title: "Lab Connections",
    blurb: "Sixteen reagents, methods, or labels. Sort them into four groups of four.",
    meta: "21 puzzles · themes · lives · hints",
    preview: "connections",
  },
  {
    id: "strands",
    title: "Lab Strands",
    blurb: "A letter grid of reagents and functional groups. Link adjacent letters, find the theme words, then the spanagram.",
    meta: "7 boards · extras earn hints · daily",
    preview: "strands",
  },
];

function GamePreview({ kind }) {
  if (kind === "wordle") {
    const rows = [
      ["g", "c", "y", "c", "c"],
      ["g", "g", "c", "y", "c"],
      ["g", "g", "g", "g", "g"],
    ];
    return (
      <div className="menu-preview wordle" aria-hidden="true">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex}>
            {row.map((tone, cell) => <span className={tone} key={cell} />)}
          </div>
        ))}
      </div>
    );
  }
  if (kind === "connections") {
    return (
      <div className="menu-preview connections" aria-hidden="true">
        <span className="solved">Four solvents</span>
        <span /><span /><span /><span />
        <span /><span /><span /><span />
        <span /><span /><span /><span />
      </div>
    );
  }
  return (
    <div className="menu-preview strands" aria-hidden="true">
      {"BONDHOMOACIDPI".split("").map((letter, index) => (
        <span className={index < 4 ? "on" : ""} key={index}>{letter}</span>
      ))}
    </div>
  );
}

const GAMES = {
  wordle: ChemWordle,
  connections: ChemConnections,
  strands: ChemStrands,
};

export default function ChemistryGames() {
  const [gameId, setGameId] = useState(null);
  const Active = gameId ? GAMES[gameId] : null;

  return (
    <main className="page games-page">
      <div className="event-banner">
        <img src="/brand/group-trip-2025.jpg" alt="" />
      </div>
      <div className="event-head">
        <div>
          <h1>Chemistry games</h1>
          <p className="lede">
            Three lab games, ready while the group paints the grid. A round stays in this browser.
          </p>
        </div>
      </div>

      {!Active ? (
        <div className="game-grid">
          {MENU.map((item) => (
            <section className="panel game-card" key={item.id}>
              <GamePreview kind={item.preview} />
              <h2>{item.title}</h2>
              <p>{item.blurb}</p>
              <p className="help">{item.meta}</p>
              <button className="primary" type="button" onClick={() => setGameId(item.id)}>Play</button>
            </section>
          ))}
        </div>
      ) : (
        <Active onBack={() => setGameId(null)} />
      )}
    </main>
  );
}
