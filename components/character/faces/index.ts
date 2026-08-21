import { EmberBody, LunaBody, NimbusBody, SproutBody, type BodyProps } from "./bodies";

export type DrawnId = "nimbus" | "sprout" | "ember" | "luna";

export const DRAWN: Record<
  DrawnId,
  { name: string; blurb: string; Body: (p: BodyProps) => React.ReactNode }
> = {
  nimbus: { name: "Nimbus", blurb: "A small cloud. Dry, warm, always there.", Body: NimbusBody },
  sprout: { name: "Sprout", blurb: "A seedling. Perks up when you're doing well.", Body: SproutBody },
  ember: { name: "Ember", blurb: "A little flame. Loves a streak.", Body: EmberBody },
  luna: { name: "Luna", blurb: "A crescent moon. Best after dark.", Body: LunaBody },
};

export const DRAWN_IDS = Object.keys(DRAWN) as DrawnId[];

/** Cast values are either `drawn:<id>` or a path to a .riv file. */
export const DRAWN_PREFIX = "drawn:";
export const drawnValue = (id: DrawnId) => `${DRAWN_PREFIX}${id}`;

export function parseDrawn(value: string): DrawnId | null {
  if (!value) return "nimbus"; // legacy empty value meant the built-in character
  if (!value.startsWith(DRAWN_PREFIX)) return null;
  const id = value.slice(DRAWN_PREFIX.length) as DrawnId;
  return id in DRAWN ? id : "nimbus";
}
