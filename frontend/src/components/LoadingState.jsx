export default function LoadingState({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 py-10 justify-center text-mist-500">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-400 opacity-60"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-signal-500"></span>
      </span>
      <span className="font-mono text-sm tracking-wide">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="py-10 px-6 text-center border border-ember-500/30 bg-ember-500/5 rounded-2xl">
      <p className="text-ember-400 font-medium mb-1">Couldn't load that</p>
      <p className="text-mist-500 text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 text-mist-100 text-sm font-medium transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
