import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function SkillPicker({ label, value, onChange }) {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    api.listSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  const grouped = skills.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div>
      {label && (
        <label className="block text-xs font-mono uppercase tracking-wider text-mist-500 mb-1.5">
          {label}
        </label>
      )}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-900 border border-ink-600 rounded-lg px-3.5 py-2.5 text-mist-100 focus:border-signal-500 outline-none transition-colors appearance-none"
      >
        <option value="" disabled>
          Select a skill…
        </option>
        {Object.entries(grouped).map(([category, list]) => (
          <optgroup key={category} label={category}>
            {list.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.peopleCount})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
