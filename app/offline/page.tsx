import { Character } from "@/components/character";

export default function Offline() {
  return (
    <div className="grid min-h-dvh place-items-center px-8 text-center">
      <div>
        <Character mood="sleepy" size={140} />
        <h1 className="mt-6 text-2xl font-black text-text">No signal</h1>
        <p className="mt-2 text-[14px] font-semibold text-muted">
          Tick your habits when you&apos;re back online — nothing is lost.
        </p>
      </div>
    </div>
  );
}
