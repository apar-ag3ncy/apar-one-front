// Trace a single Fit glyph image into an SVG path you can paste into the APAR
// wordmark cycle (components/apar-logo.tsx) as a baked `vector:` — genuine Fit,
// no Adobe kit needed (same technique as the baked Devanagari अ / Latin A).
//
// Why a tracer: Fit's exact geometry can't be reproduced faithfully by eye — it
// must be vectorized from the real artwork. Fit is rectilinear, so a bitmap
// trace reproduces it crisply.
//
// One-time setup:   npm i -D potrace sharp
//
// Usage:
//   node scripts/trace-glyph.mjs public/glyphs/armenian.png
//   node scripts/trace-glyph.mjs public/glyphs/arabic.png --threshold 160
//
// Input: a PNG/JPG of the SINGLE leading glyph (the language's "A"), cropped
// tight, dark glyph on a light background (invert with --invert if light-on-dark).
// It prints the path `d`; add a SCRIPTS entry:
//   { key: "armenian", lang: "Armenian", label: "Ա", vector: "<paste d here>" }
// The logo's slot logic auto-normalizes size + right-aligns it to "PĀR".

import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";
import sharp from "sharp";
import potrace from "potrace";

const args = argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const threshold = Number((args.find((a) => a.startsWith("--threshold=")) || "").split("=")[1]) || 170;
const invert = args.includes("--invert");

if (!input) {
  console.error("usage: node scripts/trace-glyph.mjs <glyph.png> [--threshold=170] [--invert]");
  process.exit(1);
}

const pre = await sharp(readFileSync(input))
  .flatten({ background: "#ffffff" })
  .greyscale()
  .modulate(invert ? { brightness: 1 } : {})
  .normalise()
  .toBuffer();

potrace.trace(
  invert ? await sharp(pre).negate().toBuffer() : pre,
  { threshold, turdSize: 4, optTolerance: 0.2, color: "#000", background: "transparent" },
  (err, svg) => {
    if (err) throw err;
    const d = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(" ");
    const out = input.replace(/\.[^.]+$/, ".path.txt");
    writeFileSync(out, d);
    console.log(`\n✓ traced ${input}\n  → ${d.length} chars written to ${out}\n`);
    console.log("Paste into components/apar-logo.tsx SCRIPTS as a `vector:` entry.\n");
  }
);
