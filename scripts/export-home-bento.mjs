import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Run with the supplied Manish Jewellers source folder as the first argument.
// Keep originals outside public/; preserve colour and the portrait's alpha.
const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/export-home-bento.mjs <source-folder>");
const output = "public/work/home-bento";
const images = [
  ["model 9.png", "mj-ruby-necklace", 960],
  ["final women png.png", "mj-bridal-portrait", 960],
  ["website MJ.jpg.jpeg", "mj-campaign", 960],
  ["model 7.png", "mj-blue-necklace", 1280],
];
sharp.concurrency(1);
await fs.mkdir(output, { recursive: true });
for (const [file, name, maxWidth] of images) {
  for (const width of [640, maxWidth]) {
    // The supplied group photograph exceeds Sharp's default input-pixel limit.
    // JPEG shrink-on-load keeps its 24,250px original out of the page payload.
    const result = await sharp(path.join(source, file), { limitInputPixels: false }).rotate()
      .resize({ width, withoutEnlargement: true }).webp({ quality: 86, effort: 5, alphaQuality: 100 })
      .toFile(path.join(output, `${name}-${width}.webp`));
    console.log(`${name}-${width}.webp: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(1)} KiB`);
  }
}
