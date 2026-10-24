import type { CaseFonts } from "./types";

// Original per-company typography from before the Argon switch.
export const FONTS_DEFAULT: CaseFonts = {
  serif: "'Newsreader',Georgia,serif",
  sans: "'Archivo',system-ui,sans-serif",
};
export const FONTS_GIRVAAN: CaseFonts = {
  serif: "'Bodoni 72','Bodoni Moda','Didot',Georgia,serif",
  sans: "'Optima','Optima Nova','Candara','Segoe UI',system-ui,sans-serif",
};
// Preserve the original system fallbacks until these clients supply webfonts.
export const FONTS_MAISON: CaseFonts = {
  serif: "'Florentia','Bodoni 72','Bodoni Moda','Didot',Georgia,serif",
  sans: "'Balham','Optima','Candara','Segoe UI',system-ui,sans-serif",
};
export const FONTS_ACHAL: CaseFonts = {
  serif: "'Blisstwin','Newsreader',Georgia,serif",
  sans: "'Archivo',system-ui,sans-serif",
};
