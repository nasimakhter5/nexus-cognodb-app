import { Link } from "react-router-dom";

const LEVEL_STYLES = {
  expert: "text-ember-400 bg-ember-500/10 border-ember-500/30",
  intermediate: "text-signal-400 bg-signal-500/10 border-signal-500/30",
  beginner: "text-mist-500 bg-mist-500/10 border-mist-500/20",
};

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function PersonCard({ person, hops, showSkillBadge = true }) {
  return (
    <Link
      to={`/people/${person.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-ink-700 bg-ink-900/60 hover:bg-ink-800 hover:border-signal-500/50 transition-all"
    >
      <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-signal-500 to-signal-600 flex items-center justify-center font-display text-sm text-ink-950">
        {initials(person.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-mist-100 truncate group-hover:text-signal-400 transition-colors">
            {person.name}
          </p>
          {typeof hops === "number" && (
            <span className="shrink-0 font-mono text-[11px] px-1.5 py-0.5 rounded bg-ink-700 text-mist-300">
              {hops} hop{hops !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-mist-500 truncate">
          {person.title} · {person.team}
        </p>
      </div>
      {showSkillBadge && person.skillLevel && (
        <span
          className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full border capitalize ${
            LEVEL_STYLES[person.skillLevel] || LEVEL_STYLES.beginner
          }`}
        >
          {person.skillLevel}
        </span>
      )}
    </Link>
  );
}
