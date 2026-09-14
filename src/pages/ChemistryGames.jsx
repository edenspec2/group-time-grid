import { useState } from "react";
import ChemConnections from "../components/ChemConnections.jsx";
import ChemWordle from "../components/ChemWordle.jsx";

const MENU = [
  {
    id: "wordle",
    title: "Chemle",
    blurb: "Guess the hidden chemistry word. Any letters are allowed — the answer is still from the lab lexicon.",
    meta: "4–7 letters · 4/6/8 guesses · daily · hard mode",
  },
  {
    id: "connections",
    title: "Lab Connections",
    blurb: "Sixteen reagents, methods, or labels. Sort them into four groups of four.",
    meta: "21 puzzles · themes · lives · hints",
  },
];

export default function ChemistryGames() {
  const [gameId, setGameId] = useState(null);

  return (
    <main className="page games-page">
      <div className="event-banner">
        <img src="/brand/group-trip-2025.jpg" alt="" />
      </div>
      <div className="event-head">
        <div>
          <h1>Chemistry games</h1>
          <p className="lede">
            Chemle and Lab Connections for the Milo Group. Play while people paint the grid.
            Nothing here is saved to a meeting.
          </p>
        </div>
      </div>

      {!gameId ? (
        <div className="game-grid game-grid-two">
          {MENU.map((item) => (
            <section className="panel game-card" key={item.id}>
              <h2>{item.title}</h2>
              <p>{item.blurb}</p>
              <p className="help">{item.meta}</p>
              <button className="primary" type="button" onClick={() => setGameId(item.id)}>Play</button>
            </section>
          ))}
        </div>
      ) : gameId === "wordle" ? (
        <ChemWordle onBack={() => setGameId(null)} />
      ) : (
        <ChemConnections onBack={() => setGameId(null)} />
      )}
    </main>
  );
}
