/** Generic instant skeleton for every tab that doesn't ship its own —
 *  the page paints the moment she taps, content streams in behind it. */
export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="space-y-2 px-1 pt-1">
        <div className="h-6 w-36 rounded-lg bg-surface-2" />
        <div className="h-3 w-48 rounded-full bg-surface-2" />
      </div>
      <div className="card h-36 bg-surface-2/30" />
      <div className="card divide-y divide-line-soft">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-surface-2" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 rounded-full bg-surface-2" />
              <div className="h-2 w-24 rounded-full bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
