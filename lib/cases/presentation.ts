import type { CaseData, CaseFonts } from "./types";
import type { CSSProperties } from "react";

/** Internal stories share a white editorial surface. Client cards keep their
 * own brand palettes; artwork and motion profiles remain independent. */
export const CASE_PAGE_THEME = {
  bg: "#ffffff",
  bg2: "#ffffff",
  ink: "#111111",
  soft: "#333333",
  accent: "#111111",
  accentSoft: "transparent",
  line: "rgba(17,17,17,.18)",
} as const;

/** CSS custom properties that theme a `.fc-card` - colours + fonts from a case. */
export function featuredCardVars(c: {
  theme: CaseData["theme"];
  fonts: CaseFonts;
}): CSSProperties {
  return {
    "--fc-bg": c.theme.bg,
    "--fc-bg2": c.theme.bg2,
    "--fc-ink": c.theme.ink,
    "--fc-accent": c.theme.accent,
    "--serif": c.fonts.serif,
    "--sans": c.fonts.sans,
  } as CSSProperties;
}
