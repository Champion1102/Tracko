/** Instant content skeleton for the sponsor tabs — the layout's header and
 *  nav are already painted, this fills the page slot while data loads. */
export default function SponsorLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="card flex items-center gap-4 p-4">
        <div className="h-[110px] w-[110px] shrink-0 rounded-2xl bg-surface-2" />
        <div className="flex-1 space-y-2.5">
          <div className="h-2.5 w-20 rounded-full bg-surface-2" />
          <div className="h-7 w-28 rounded-lg bg-surface-2" />
          <div className="h-3 w-full rounded-full bg-surface-2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-16 bg-surface-2/30" />
        ))}
      </div>
      <div className="card h-40 bg-surface-2/30" />
      <div className="card h-56 bg-surface-2/30" />
    </div>
  );
}
