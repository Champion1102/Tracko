export type Theme = "system" | "light" | "dark";

export const THEME_COOKIE = "tracko_theme";

/**
 * The theme lives in a cookie rather than localStorage so the SERVER can stamp
 * `data-theme` onto <html> in the initial HTML. That removes the two problems
 * a client-side theme always has: the flash of the wrong palette before the
 * script runs, and the attribute being lost whenever React regenerates the
 * tree. It also means no inline <script>, which React 19 complains about.
 */
export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" || value === "system" ? value : "dark";
}

/** What to put on <html>. "system" means no attribute, so CSS decides. */
export function themeAttr(theme: Theme): string | undefined {
  return theme === "system" ? undefined : theme;
}
