import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Pass the Manish Jewellers folder, or --image <source-file> <output-name> <width>.
// Keep originals outside public/; preserve colour and the portrait's alpha.
const [source, imageFile, imageName, imageWidth] = process.argv.slice(2);
if (!source) throw new Error("Pass a Manish Jewellers source folder or --image <file> <name> <width>.");
const output = "public/work/home-bento";
const images = source === "--image" ? [[imageFile, imageName, Number(imageWidth)]] : [
  ["model 9.png", "mj-ruby-necklace", 960],
  ["final women png.png", "mj-bridal-portrait", 960],
  ["website MJ.jpg.jpeg", "mj-campaign", 960],
  ["model 7.png", "mj-blue-necklace", 1280],
];
for (const [file, name, width] of images) {
  if (!file || !/^[a-z0-9-]+$/.test(name ?? "") || !Number.isInteger(width) || width <= 640) {
    throw new Error("Each export needs a source file, a lowercase slug and a width above 640px.");
  }
}
sharp.concurrency(1);
await fs.mkdir(output, { recursive: true });
for (const [file, name, maxWidth] of images) {
  for (const width of [640, maxWidth]) {
    // The supplied group photograph exceeds Sharp's default input-pixel limit.
    // JPEG shrink-on-load keeps its 24,250px original out of the page payload.
    const result = await sharp(source === "--image" ? file : path.join(source, file), { limitInputPixels: false }).rotate()
      .resize({ width, withoutEnlargement: true }).webp({ quality: 86, effort: 5, alphaQuality: 100 })
      .toFile(path.join(output, `${name}-${width}.webp`));
    console.log(`${name}-${width}.webp: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(1)} KiB`);
  }
}
