import { useEffect, useState } from "react";
import ChemistryGames from "./pages/ChemistryGames.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventPage from "./pages/EventPage.jsx";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function go(to) {
    history.pushState({}, "", to);
    setPath(to);
  }

  const match = path.match(/^\/m\/([^/]+)/);

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); go("/"); }}>
          <img src="/brand/logo.png" alt="Milo Lab" />
          <span className="brand-text">
            <strong>Milo Group</strong>
            <small>Meeting times</small>
          </span>
        </a>
        <nav className="topnav">
          <a href="/games" onClick={(e) => { e.preventDefault(); go("/games"); }}>Chemistry games</a>
          <span className="hint">Physical organic chemistry · Ben-Gurion University</span>
        </nav>
      </header>
      {match ? <EventPage id={match[1]} /> : path === "/games" ? <ChemistryGames /> : <CreateEvent onCreated={(id, session) => {
        if (session) localStorage.setItem(`gtg:${id}`, JSON.stringify(session));
        go(`/m/${id}`);
      }} />}
    </>
  );
}
