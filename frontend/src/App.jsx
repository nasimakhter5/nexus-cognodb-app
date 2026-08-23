import { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { api } from "./api.js";
import SkillFinder from "./pages/SkillFinder.jsx";
import Connections from "./pages/Connections.jsx";
import People from "./pages/People.jsx";
import PersonProfile from "./pages/PersonProfile.jsx";

const NAV_LINK_CLASS = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
    isActive ? "text-signal-400 bg-signal-500/10" : "text-mist-500 hover:text-mist-100"
  }`;

function DbBanner() {
  const [state, setState] = useState("checking"); // checking | ok | down

  useEffect(() => {
    api
      .health()
      .then((h) => setState(h.dbAvailable ? "ok" : "down"))
      .catch(() => setState("down"));
  }, []);

  if (state !== "down") return null;
  return (
    <div className="bg-ember-500/15 border-b border-ember-500/30 text-ember-400 text-sm text-center py-2 px-4">
      Can't reach CognoDB right now — check that your instance is running and{" "}
      <code className="font-mono">backend/.env</code> has the right connection details.
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <DbBanner />
      <header className="border-b border-ink-700/80 sticky top-0 z-30 bg-ink-950/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ember-500"></span>
            <span className="font-display text-xl text-mist-100">Nexus</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={NAV_LINK_CLASS}>
              Find skill
            </NavLink>
            <NavLink to="/connections" className={NAV_LINK_CLASS}>
              Connections
            </NavLink>
            <NavLink to="/people" className={NAV_LINK_CLASS}>
              People
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<SkillFinder />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<PersonProfile />} />
        </Routes>
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-10 text-center text-xs text-mist-500 font-mono">
        Nexus · built on CognoDB · a graph of people, skills and connections
      </footer>
    </div>
  );
}
