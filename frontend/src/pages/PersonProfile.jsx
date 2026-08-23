import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import LoadingState, { ErrorState } from "../components/LoadingState.jsx";

const LEVEL_STYLES = {
  expert: "text-ember-400 bg-ember-500/10 border-ember-500/30",
  intermediate: "text-signal-400 bg-signal-500/10 border-signal-500/30",
  beginner: "text-mist-500 bg-mist-500/10 border-mist-500/20",
};

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

export default function PersonProfile() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState("loading");

  function load() {
    setStatus("loading");
    api
      .getPerson(id)
      .then((data) => {
        setPerson(data);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, [id]);

  if (status === "loading") return <LoadingState label="Loading profile" />;
  if (status === "error")
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <ErrorState message="Couldn't load this profile." onRetry={load} />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-start gap-5 mb-10">
        <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-signal-500 to-signal-600 flex items-center justify-center font-display text-xl text-ink-950">
          {initials(person.name)}
        </div>
        <div>
          <h1 className="font-display text-3xl text-mist-100">{person.name}</h1>
          <p className="text-mist-500 mt-1">
            {person.title} · {person.team} · {person.location}
          </p>
          <p className="font-mono text-xs text-mist-500 mt-2">
            {person.email} · {person.yearsExperience} yrs experience
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal-400 mb-4">
          Skills
        </h2>
        {person.skills.length === 0 ? (
          <p className="text-mist-500 text-sm">No skills recorded yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {person.skills.map((s) => (
              <span
                key={s.name}
                className={`text-sm px-3 py-1.5 rounded-full border capitalize ${
                  LEVEL_STYLES[s.level] || LEVEL_STYLES.beginner
                }`}
              >
                {s.name} <span className="opacity-70">· {s.level}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal-400 mb-4">
          Direct colleagues ({person.colleagues.length})
        </h2>
        {person.colleagues.length === 0 ? (
          <p className="text-mist-500 text-sm">No colleagues recorded yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {person.colleagues.map((c) => (
              <Link
                key={c.id}
                to={`/people/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-ink-700 bg-ink-900/60 hover:border-signal-500/50 hover:bg-ink-800 transition-colors"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-ink-700 flex items-center justify-center font-display text-xs text-mist-300">
                  {initials(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-mist-100 truncate">{c.name}</p>
                  <p className="text-xs text-mist-500 truncate">{c.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
