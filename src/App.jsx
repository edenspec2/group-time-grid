import { useEffect, useState } from "react";
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
          Group Time Grid
        </a>
        <span className="hint">When2meet-style availability, with yellow and live counts</span>
      </header>
      {match ? <EventPage id={match[1]} /> : <CreateEvent onCreated={(id, session) => {
        if (session) localStorage.setItem(`gtg:${id}`, JSON.stringify(session));
        go(`/m/${id}`);
      }} />}
    </>
  );
}
