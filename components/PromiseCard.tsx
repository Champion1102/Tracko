/**
 * Her own handwriting from day one, shown back to her. This is the payoff for
 * making the promise a real moment rather than a checkbox.
 */
export function PromiseCard({
  text,
  signature,
  signedAt,
  name,
  daysElapsed,
}: {
  text: string;
  signature: string;
  signedAt: string | null;
  name: string;
  daysElapsed: number;
}) {
  if (!signedAt) return null;

  return (
    <section className="card overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[12px] font-bold text-faint">What you promised</p>
      </div>

      <div className="px-4 pb-4">
        <p className="text-[13.5px] leading-relaxed font-bold whitespace-pre-line text-muted">
          {text}
        </p>

        {signature && (
          <div className="mt-4 border-t border-line-soft pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signature}
              alt={`${name || "Her"} signature`}
              className="h-16 w-full object-contain object-left opacity-90"
            />
          </div>
        )}

        <p className="mt-2 text-[11.5px] font-bold text-faint">
          Signed{" "}
          {new Date(signedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {daysElapsed > 1 && ` · ${daysElapsed - 1} days ago`}
        </p>
      </div>
    </section>
  );
}
