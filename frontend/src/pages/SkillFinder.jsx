import { useState } from "react";
import { api } from "../api.js";
import PersonPicker from "../components/PersonPicker.jsx";
import SkillPicker from "../components/SkillPicker.jsx";
import PersonCard from "../components/PersonCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState, { ErrorState } from "../components/LoadingState.jsx";

export default function SkillFinder() {
  const [me, setMe] = useState(null);
  const [skill, setSkill] = useState("");
  const [maxHops, setMaxHops] = useState(3);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error | done

  async function search() {
    if (!me || !skill) return;
    setStatus("loading");
    try {
      const data = await api.networkSkillSearch(me.id, skill, maxHops);
      setResults(data);
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-400 mb-3">
          Network · Skill Search
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-mist-100 leading-tight">
          Who in my network
          <br />
          <span className="text-signal-400 italic">actually knows</span> this?
        </h1>
        <p className="text-mist-500 mt-4 max-w-xl">
          Pick yourself, pick a skill. Nexus walks the colleague graph outward
          from you — coworkers, then coworkers of coworkers — and ranks who
          can actually help, closest first.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <PersonPicker label="Starting from" value={me} onChange={setMe} placeholder="Your name…" />
        <SkillPicker label="Looking for" value={skill} onChange={setSkill} />
      </div>

      <div className="flex items-center gap-4 mb-8">
        <label className="text-xs font-mono uppercase tracking-wider text-mist-500 shrink-0">
          Max hops: {maxHops}
        </label>
        <input
          type="range"
          min="1"
          max="4"
          value={maxHops}
          onChange={(e) => setMaxHops(Number(e.target.value))}
          className="flex-1 accent-signal-500"
        />
        <button
          onClick={search}
          disabled={!me || !skill}
          className="shrink-0 px-5 py-2.5 rounded-lg bg-signal-500 hover:bg-signal-600 disabled:bg-ink-700 disabled:text-mist-500 disabled:cursor-not-allowed text-ink-950 disabled:text-opacity-100 font-medium transition-colors"
        >
          Find people
        </button>
      </div>

      {status === "loading" && <LoadingState label="Walking the graph" />}
      {status === "error" && (
        <ErrorState
          message="Couldn't run that search. Is the Nexus backend running and connected to CognoDB?"
          onRetry={search}
        />
      )}
      {status === "done" && results && results.length === 0 && (
        <EmptyState
          icon="◌"
          title="Nobody found within that many hops"
          hint="Try widening the search with more hops, or pick a more common skill."
        />
      )}
      {status === "done" && results && results.length > 0 && (
        <div>
          <p className="text-xs font-mono text-mist-500 mb-3 uppercase tracking-wider">
            {results.length} {results.length === 1 ? "person" : "people"} found, closest first
          </p>
          <div className="flex flex-col gap-2.5">
            {results.map((p) => (
              <PersonCard key={p.id} person={p} hops={p.hops} />
            ))}
          </div>
        </div>
      )}
      {status === "idle" && (
        <EmptyState
          icon="✦"
          title="Set a starting person and a skill to begin"
          hint="This traversal is graph-native: it walks a variable number of COLLEAGUE_OF hops and filters by HAS_SKILL in one query."
        />
      )}
    </div>
  );
}
