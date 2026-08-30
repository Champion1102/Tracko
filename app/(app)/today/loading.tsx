/** Paints instantly on navigation while the day loads — mirrors the real
 *  layout (header, week strip, ten rows) so nothing jumps. */
export default function TodayLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="flex items-end justify-between px-1 pt-1">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded-lg bg-surface-2" />
          <div className="h-3 w-44 rounded-full bg-surface-2" />
        </div>
        <div className="h-12 w-12 rounded-full border-4 border-surface-2" />
      </div>

      <div className="flex justify-between px-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="h-2 w-2.5 rounded bg-surface-2" />
            <div className="h-[30px] w-[30px] rounded-full border-[3px] border-surface-2" />
          </div>
        ))}
      </div>

      <div className="card divide-y divide-line-soft">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
            <div className="h-7 w-7 shrink-0 rounded-full border-2 border-surface-2" />
            <div className="h-3.5 flex-1 max-w-44 rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
