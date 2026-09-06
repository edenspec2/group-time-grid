import { useMemo, useState } from "react";
import Molecule from "../components/Molecule.jsx";
import { CHEMISTRY_GAMES, dealRound } from "../lib/chemistry-games.js";

export default function ChemistryGames() {
  const [gameId, setGameId] = useState(null);
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  const game = CHEMISTRY_GAMES.find((item) => item.id === gameId) || null;
  const round = useMemo(
    () => (game ? dealRound(game.questions) : []),
    [game, seed],
  );
  const question = round[index] || null;
  const done = game && index >= round.length;

  function start(id) {
    setGameId(id);
    setSeed((n) => n + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
  }

  function choose(choice) {
    if (picked || !question) return;
    setPicked(choice);
    if (choice === question.answer) setScore((n) => n + 1);
  }

  function next() {
    setPicked(null);
    setIndex((n) => n + 1);
  }

  return (
    <main className="page games-page">
      <div className="event-banner">
        <img src="/brand/group-trip-2025.jpg" alt="" />
      </div>
      <div className="event-head">
        <div>
          <h1>Chemistry games</h1>
          <p className="lede">
            Short physical-organic warm-ups for the Milo Group. Play while people paint the grid.
            Nothing here is saved to a meeting.
          </p>
        </div>
      </div>

      {!game ? (
        <div className="game-grid">
          {CHEMISTRY_GAMES.map((item) => (
            <section className="panel game-card" key={item.id}>
              <h2>{item.title}</h2>
              <p>{item.blurb}</p>
              <p className="help">{item.questions.length} questions · 8 per round</p>
              <button className="primary" type="button" onClick={() => start(item.id)}>Play</button>
            </section>
          ))}
        </div>
      ) : done ? (
        <section className="panel game-play">
          <h2>{game.title}</h2>
          <p className="game-score">You scored {score} / {round.length}.</p>
          <p className="help">
            {score === round.length
              ? "Clean sheet. The group calendar can wait."
              : score >= Math.ceil(round.length * 0.7)
                ? "Solid. One more round before the meeting pins a time?"
                : "Warm-up complete. Another round, or back to the grid?"}
          </p>
          <div className="actions">
            <button className="primary" type="button" onClick={() => start(game.id)}>Play again</button>
            <button className="ghost" type="button" onClick={() => setGameId(null)}>All games</button>
          </div>
        </section>
      ) : (
        <section className="panel game-play">
          <p className="help">{game.title} · {index + 1} of {round.length}</p>
          <h2>{question.prompt}</h2>
          {question.molecule ? <Molecule id={question.molecule} /> : null}
          <div className="game-choices" role="group" aria-label="Answer choices">
            {question.choices.map((choice) => {
              const correct = picked && choice === question.answer;
              const wrong = picked && choice === picked && choice !== question.answer;
              return (
                <button
                  key={choice}
                  type="button"
                  className={`ghost ${correct ? "game-correct" : ""} ${wrong ? "game-wrong" : ""}`}
                  disabled={Boolean(picked)}
                  onClick={() => choose(choice)}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {picked ? (
            <div className="game-explain">
              <p>{picked === question.answer ? "Correct." : `Not quite. ${question.answer}.`}</p>
              <p className="help">{question.explain}</p>
              <button className="primary" type="button" onClick={next}>
                {index + 1 === round.length ? "See score" : "Next"}
              </button>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
