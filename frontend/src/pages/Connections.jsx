import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import PersonPicker from "../components/PersonPicker.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState, { ErrorState } from "../components/LoadingState.jsx";

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function PathVisual({ people }) {
  const n = people.length;
  const width = Math.max(n * 140, 300);
  return (
    <div className="overflow-x-auto pb-4">
      <svg width={width} height="150" className="mx-auto">
        <line
          x1="70"
          y1="60"
          x2={width - 70}
          y2="60"
          stroke="#2C3866"
          strokeWidth="2"
          className="hop-line"
        />
        {people.map((p, i) => {
          const x = 70 + i * ((width - 140) / Math.max(n - 1, 1));
          return (
            <g key={p.id}>
              <circle
                cx={x}
                cy="60"
                r="26"
                fill={i === 0 || i === n - 1 ? "#FF7F4D" : "#171F3D"}
                stroke={i === 0 || i === n - 1 ? "#FF9B6A" : "#6E76F5"}
                strokeWidth="2"
              />
              <text
                x={x}
                y="65"
                textAnchor="middle"
                fill={i === 0 || i === n - 1 ? "#0B0F1F" : "#F4F5FB"}
                fontSize="14"
                fontFamily="'Fraunces', serif"
              >
                {initials(p.name)}
              </text>
              <text
                x={x}
                y="105"
                textAnchor="middle"
                fill="#C3C8E4"
                fontSize="12"
                fontFamily="'Inter', sans-serif"
              >
                {p.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Connections() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function search() {
    if (!from || !to) return;
    setStatus("loading");
    try {
      const data = await api.connectionPath(from.id, to.id);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-400 mb-3">
          Network · Shortest Path
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-mist-100 leading-tight">
          How am I
          <span className="text-ember-400 italic"> connected</span>
          <br />
          to them?
        </h1>
        <p className="text-mist-500 mt-4 max-w-xl">
          A single <code className="font-mono text-signal-400">shortestPath()</code> traversal
          finds the chain of colleagues linking any two people — no matter how
          many teams sit between them.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <PersonPicker label="From" value={from} onChange={setFrom} />
        <PersonPicker label="To" value={to} onChange={setTo} />
      </div>

      <button
        onClick={search}
        disabled={!from || !to}
        className="mb-8 px-5 py-2.5 rounded-lg bg-ember-500 hover:bg-ember-400 disabled:bg-ink-700 disabled:text-mist-500 disabled:cursor-not-allowed text-ink-950 font-medium transition-colors"
      >
        Trace the path
      </button>

      {status === "loading" && <LoadingState label="Tracing shortest path" />}
      {status === "error" && (
        <ErrorState message="Couldn't trace that path. Try again." onRetry={search} />
      )}
      {status === "done" && result && !result.connected && (
        <EmptyState
          icon="⤬"
          title="No connection found"
          hint="These two aren't linked through the colleague network yet."
        />
      )}
      {status === "done" && result && result.connected && (
        <div className="border border-ink-700 rounded-2xl bg-ink-900/60 p-6">
          <PathVisual people={result.people} />
          <p className="text-center font-mono text-sm text-mist-500 mt-2">
            {result.hops} hop{result.hops !== 1 ? "s" : ""} apart via{" "}
            {result.people
              .slice(1, -1)
              .map((p) => p.name)
              .join(", ") || "a direct connection"}
          </p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {result.people.map((p) => (
              <Link
                key={p.id}
                to={`/people/${p.id}`}
                className="text-xs px-3 py-1.5 rounded-full border border-ink-600 text-mist-300 hover:border-signal-500 hover:text-signal-400 transition-colors"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {status === "idle" && (
        <EmptyState
          icon="✦"
          title="Pick two people to trace their connection"
        />
      )}
    </div>
  );
}
