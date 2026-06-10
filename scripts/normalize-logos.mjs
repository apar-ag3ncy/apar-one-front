/**
 * Normalise client logos so every featured card shows its logo at a consistent
 * optical size, regardless of how much transparent padding the source file has
 * or how wide/tall the mark is.
 *
 * What it does, per logo:
 *   1. Trims the file down to its actual ink (non-transparent) bounds.
 *   2. Scales that ink so every logo has the same *geometric-mean* size
 *      (sqrt(w*h)) — a good proxy for "perceived size" across marks that range
 *      from near-square stacked logos to very wide wordmarks. Wide marks are
 *      clamped so they don't run edge-to-edge.
 *   3. Re-centres it on a transparent canvas of one fixed aspect ratio.
 *
 * Because every output shares the same canvas aspect, the CSS box in
 * globals.css (.fc-logo-img / .fc-logo-mask) renders them all at the same
 * on-screen size — the optical balancing is baked into the file.
 *
 * Re-runnable: reads originals from logo-src, writes public/logos.
 * Drop a new logo into logo-src (named <slug>.png) and re-run.
 *
 *   node scripts/normalize-logos.mjs
 */
import sharp from "sharp";
import { readdirSync } from "fs";
import path from "path";

const SRC = "logo-src";
const OUT = "public/logos";

// Output canvas. Aspect (CW/CH) is the only thing that must be identical across
// all logos — its exact value just sets how much room wide wordmarks get.
const CW = 1600;
const CH = 1000;
// Target geometric-mean size of the ink (in canvas px) — the "everyone is this
// big" knob. Wide marks get clamped by MAXW before they reach it.
const TARGET_G = 820;
const MAXW = Math.round(CW * 0.96); // widest a mark may draw
const MAXH = Math.round(CH * 0.92); // tallest a mark may draw

/** Per-logo fine-tune multipliers, only for marks that still read off. 1 = none. */
const NUDGE = {
  // e.g. "jatubhai-velji": 1.05,
};

async function inkBounds(img, W, H) {
  const { data, info } = await img
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * ch + (ch - 1)] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".png"));
const report = [];

for (const file of files) {
  const slug = path.basename(file, ".png");
  const src = sharp(path.join(SRC, file));
  const meta = await src.metadata();
  const box = await inkBounds(src, meta.width, meta.height);

  // Geometric-mean target → draw size that preserves the ink's aspect ratio.
  const r = box.width / box.height;
  const g = TARGET_G * (NUDGE[slug] ?? 1);
  let drawW = g * Math.sqrt(r);
  let drawH = g / Math.sqrt(r);
  // Clamp without distorting (keep aspect).
  const k = Math.min(1, MAXW / drawW, MAXH / drawH);
  drawW = Math.round(drawW * k);
  drawH = Math.round(drawH * k);

  const ink = await src
    .clone()
    .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
    .resize(drawW, drawH, { fit: "fill" })
    .png()
    .toBuffer();

  await sharp({
    create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: ink, gravity: "center" }])
    .png()
    .toFile(path.join(OUT, file));

  report.push({
    slug,
    inkAspect: +r.toFixed(2),
    draw: `${drawW}x${drawH}`,
    geoMean: Math.round(Math.sqrt(drawW * drawH)),
    widthFill: `${Math.round((drawW / CW) * 100)}%`,
  });
}

console.table(report);
console.log(`\n✓ normalised ${files.length} logos → ${OUT} (originals kept in ${SRC})`);
