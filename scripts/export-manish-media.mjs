import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [shootFolder, monogramFile] = process.argv.slice(2);
if (!shootFolder || !monogramFile) throw new Error("Usage: node scripts/export-manish-media.mjs <shoot-folder> <monogram-file>");
const slug = "manish-jewellers";
const output = `public/work/${slug}/curated`;
const names = ["gold-portrait", "trio-landscape", "blue-necklace", "blue-portrait", "crimson-drop-earrings",
  "crimson-fan-necklace", "ruby-earrings", "ruby-portrait", "blue-earrings"];
const sources = [...names.map(name => [name, path.join(shootFolder, `${name}.webp`)]), ["brand-monogram", monogramFile]];
const assets = [];
await fs.mkdir(output, { recursive: true });
sharp.concurrency(2);
for (const [name, source] of sources) {
  const file = `/work/${slug}/curated/${name}.webp`;
  const image = await sharp(source).rotate().resize(1600, 1800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 5, alphaQuality: 100 }).toFile(`public${file}`);
  assets.push({ slug, source, file, width: image.width, height: image.height, bytes: image.size, sourceBytes: (await fs.stat(source)).size });
}
const manifestPath = "docs/case-media-sources.json";
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
manifest.sourceFolders[slug] = shootFolder;
manifest.assets = [...manifest.assets.filter(asset => asset.slug !== slug), ...assets];
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${assets.length} full-composition images, ${(assets.reduce((total, asset) => total + asset.bytes, 0) / 1048576).toFixed(2)} MB. Original files are unchanged.`);
