import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function PersonPicker({ label, value, onChange, placeholder = "Type a name…" }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .searchPeople(query)
        .then(setResults)
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative" ref={wrapRef}>
      {label && (
        <label className="block text-xs font-mono uppercase tracking-wider text-mist-500 mb-1.5">
          {label}
        </label>
      )}
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        className="w-full bg-ink-900 border border-ink-600 rounded-lg px-3.5 py-2.5 text-mist-100 placeholder:text-mist-500 focus:border-signal-500 outline-none transition-colors"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-auto rounded-lg border border-ink-600 bg-ink-800 shadow-xl shadow-black/40">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p);
                setQuery(p.name);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-ink-700 transition-colors flex items-center justify-between gap-2"
            >
              <span className="text-mist-100 text-sm">{p.name}</span>
              <span className="text-mist-500 text-xs">{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
