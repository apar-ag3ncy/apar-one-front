# Glyph drop-zone — add a language's leading "A" to the APAR wordmark

The wordmark (components/apar-logo.tsx) cycles its leading letter through scripts.
Two are baked as genuine Fit vector outlines (Devanagari अ, Latin A) so they show
without the Adobe Fonts kit. To add another language the same way, its Fit glyph
has to be **vectorized from the real artwork** — Fit's exact geometry can't be
reproduced by eye from a screenshot.

## How to add one (e.g. Armenian, Arabic, Tamil)

1. Export/crop the **single leading glyph** (that language's "A") from the Fit
   artwork as a PNG — tight crop, ideally dark glyph on a light background.
2. Drop it here, named by language: `armenian.png`, `arabic.png`, `tamil.png`, …
3. Run the tracer (one-time `npm i -D potrace sharp` first):
   ```
   node scripts/trace-glyph.mjs public/glyphs/armenian.png
   ```
   It writes the SVG path to `armenian.path.txt`.
4. Add a SCRIPTS entry in `components/apar-logo.tsx`:
   ```ts
   { key: "armenian", lang: "Armenian", label: "Ա", vector: "<paste path>" }
   ```
   The slot logic auto-scales it to the right cap-height and right-aligns it to
   "PĀR" — no manual positioning.

Until then, those scripts only appear when the Adobe Fit kit is connected
(they're in the cycle, gated on the real Fit family loading).
