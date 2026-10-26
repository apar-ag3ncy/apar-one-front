import { mkdir } from "node:fs/promises";
import sharp from "sharp";

// Reproducible, transparent print grain. Rasterize once instead of asking every
// visitor's GPU to calculate SVG turbulence or blend a full-screen noise layer.
const size = 96;
const pixels = Buffer.alloc(size * size * 4);
let seed = 1916;
for (let i = 0; i < pixels.length; i += 4) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const shade = (seed >>> 24) & 1 ? 255 : 0;
  pixels[i] = pixels[i + 1] = pixels[i + 2] = shade;
  pixels[i + 3] = (seed >>> 16) % 11;
}
await mkdir("public/textures", { recursive: true });
await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
  .png({ palette: true, colours: 32, compressionLevel: 9 })
  .toFile("public/textures/paper-grain.png");
