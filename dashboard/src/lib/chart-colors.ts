/**
 * Single source of truth for categorical chart colors — one cohesive, ordered,
 * blue-led series shared by every chart so visuals stay consistent ("không quá xa nhau").
 *
 * - CHART_SERIES: CSS-var strings (theme-aware: they brighten in dark mode).
 *   Use for SVG / DOM via the `style` prop, e.g. style={{ stroke: seriesColor(i) }}.
 *   (CSS variables resolve in the `style`/CSS `stroke|fill|background`, NOT in raw SVG
 *   presentation attributes — so always apply these through `style`.)
 * - CHART_HEX: matching literal hex for canvas libraries (vis-network) that cannot
 *   read CSS variables. Order mirrors CHART_SERIES / the --cat-* tokens in globals.css.
 */

export const CHART_SERIES = [
  "var(--cat-1)", // blue
  "var(--cat-2)", // sky
  "var(--cat-3)", // green
  "var(--cat-4)", // amber
  "var(--cat-5)", // red
  "var(--cat-6)", // slate
  "var(--purple)",
] as const;

export const seriesColor = (i: number): string => CHART_SERIES[i % CHART_SERIES.length];

// Light-theme hex matching the --cat-* tokens (for canvas contexts only).
export const CHART_HEX = [
  "#3b6fe0", // blue
  "#4cc3e0", // sky
  "#3fbf8e", // green
  "#e6a93a", // amber
  "#e8675f", // red
  "#9aa3b2", // slate
  "#8b6fe0", // purple
] as const;

export const hexColor = (i: number): string => CHART_HEX[i % CHART_HEX.length];
