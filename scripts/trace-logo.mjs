// One-off: vectorise the flat red APAR wordmark PNG into an SVG via potrace.
// Transparent PNG pixels read as luminance 0 (black) by potrace, so we first
// flatten the logo onto a white background, then trace the dark-on-white shape.
import { Jimp } from "jimp";
import potrace from "potrace";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("public/assets/apar-logo-red.png");
const FLAT = path.resolve("scripts/.apar-flat.png");
const OUT = path.resolve("public/assets/apar-logo-red.svg");
const RED = "#EB3B25";

const img = await Jimp.read(SRC);
const flat = new Jimp({ width: img.width, height: img.height, color: 0xffffffff });
flat.composite(img, 0, 0); // alpha-composite the logo over solid white
await flat.write(FLAT);

const svg = await new Promise((resolve, reject) => {
  potrace.trace(
    FLAT,
    {
      threshold: 180,      // red luminance ~95, white 255 → split between
      turdSize: 2,         // drop sub-2px specks
      optCurve: true,
      optTolerance: 0.2,
      alphaMax: 1,
      color: RED,
      background: "transparent",
    },
    (err, out) => (err ? reject(err) : resolve(out)),
  );
});

await writeFile(OUT, svg, "utf8");
const pathLen = (svg.match(/ d="/g) || []).length;
const vb = (svg.match(/viewBox="[^"]*"/) || ["(none)"])[0];
console.log(`wrote ${OUT}\n  source ${img.width}x${img.height}  ${vb}  paths:${pathLen}  bytes:${svg.length}`);
