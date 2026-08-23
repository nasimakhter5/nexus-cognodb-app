export default function EmptyState({ icon = "○", title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-ink-600 rounded-2xl bg-ink-900/40">
      <div className="text-3xl mb-3 text-signal-400/70 font-display">{icon}</div>
      <p className="text-mist-100 font-medium mb-1">{title}</p>
      {hint && <p className="text-mist-500 text-sm max-w-sm">{hint}</p>}
    </div>
  );
}
