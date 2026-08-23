/** Paints instantly on navigation while the day loads — mirrors the real
 *  layout (header, push line, coach, habit rows) so nothing jumps. */
export default function TodayLoading() {
  return (
    <div className="animate-pulse space-y-4 pb-16" aria-hidden>
      <div className="card p-4">
        <div className="flex items-center gap-3.5">
          <div className="h-[76px] w-[76px] shrink-0 rounded-full border-8 border-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-28 rounded-full bg-surface-2" />
            <div className="h-6 w-20 rounded-lg bg-surface-2" />
            <div className="h-2.5 w-36 rounded-full bg-surface-2" />
          </div>
        </div>
        <div className="mt-3 flex justify-between gap-1 border-t border-line-soft pt-3">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="h-2 w-2.5 rounded bg-surface-2" />
              <div className="h-[18px] w-[18px] rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="card h-[46px] bg-surface-2/40" />

      <div className="flex items-end gap-2 px-1">
        <div className="h-14 w-14 shrink-0 rounded-full bg-surface-2" />
        <div className="card h-[52px] flex-1 bg-surface-2/40" />
      </div>

      <div className="flex items-baseline justify-between px-1">
        <div className="h-2.5 w-20 rounded-full bg-surface-2" />
        <div className="h-2.5 w-14 rounded-full bg-surface-2" />
      </div>

      <div className="card divide-y divide-line-soft">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3">
            <div className="h-9.5 w-9.5 shrink-0 rounded-xl bg-surface-2" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded-full bg-surface-2" />
              <div className="h-2 w-24 rounded-full bg-surface-2" />
            </div>
            <div className="h-8 w-12 rounded-xl bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
