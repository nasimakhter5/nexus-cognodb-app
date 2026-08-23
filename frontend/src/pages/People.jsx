import { useEffect, useState } from "react";
import { api } from "../api.js";
import PersonCard from "../components/PersonCard.jsx";
import LoadingState, { ErrorState } from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function People() {
  const [people, setPeople] = useState(null);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("");

  function load() {
    setStatus("loading");
    api
      .listPeople()
      .then((data) => {
        setPeople(data);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, []);

  const filtered = people?.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.team?.toLowerCase().includes(filter.toLowerCase()) ||
      p.topSkill?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-400 mb-3">
          Directory
        </p>
        <h1 className="font-display text-4xl text-mist-100 mb-4">Everyone at Orbital Labs</h1>
        <input
          type="text"
          placeholder="Filter by name, team or skill…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-ink-900 border border-ink-600 rounded-lg px-3.5 py-2.5 text-mist-100 placeholder:text-mist-500 focus:border-signal-500 outline-none transition-colors"
        />
      </div>

      {status === "loading" && <LoadingState label="Loading directory" />}
      {status === "error" && <ErrorState message="Couldn't load people." onRetry={load} />}
      {status === "done" && filtered.length === 0 && (
        <EmptyState icon="◌" title="No matches" hint="Try a different search term." />
      )}
      {status === "done" && filtered.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {filtered.map((p) => (
            <PersonCard key={p.id} person={p} showSkillBadge={false} />
          ))}
        </div>
      )}
    </div>
  );
}
