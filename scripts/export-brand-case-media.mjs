import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Exact supplied sources; keep complete compositions and their original colours.
// Run from the frontend root: node scripts/export-brand-case-media.mjs
const groups = {
  girvaan: { folder: "Girvaan products ", files: [
    ["06.jpg", "pink-bangle-hero"], ["01.jpg", "orchid-ring"],
    ["03.jpg", "lotus-necklace"], ["04.jpg", "petal-bracelet"],
    ["07.jpg", "rose-ring"], ["08.jpg", "peacock-ring"],
    ["005.jpg", "sunburst-ring"], ["earring 4.png", "emerald-earrings"],
    ["silver_6.png", "emerald-necklace"],
  ] },
  "harshit-gold": { folder: "HARSHIT GOLD IMAGES", files: [
    ["untitled folder/HARSHIT GOLD NEWSPAPER-01.jpg", "campaign-portrait-hero"],
    ["untitled folder/3.jpg", "polki-necklace"], ["untitled folder/6.jpg", "gold-necklace"],
    ["untitled folder/5.jpg", "peacock-ring"], ["untitled folder/7.jpg", "floral-ring"],
    ["untitled folder/2.jpg", "emerald-necklace"], ["untitled folder/Untitled-1.jpg", "ruby-ring"],
    ["untitled folder/8.jpg", "gold-brooch"], ["untitled folder/4.jpg", "medallion-set"],
  ] },
  "kundan-jewellers": { folder: "Kundan Jewellers - Jewellery ", files: [
    ["WhatsApp Image 2026-09-26 at 12.59.36.jpeg", "gold-pendant-hero"],
    ["WhatsApp Image 2026-09-26 at 12.59.37 (1).jpeg", "filigree-pendant"],
    ["WhatsApp Image 2026-09-26 at 12.59.37 (2).jpeg", "triangle-pendant"],
    ["WhatsApp Image 2026-09-26 at 12.59.38 (1).jpeg", "floral-set"],
    ["WhatsApp Image 2026-09-26 at 12.59.38.jpeg", "petal-set"],
    ["WhatsApp Image 2026-09-26 at 12.59.39.jpeg", "filigree-set"],
    ["WhatsApp Image 2026-09-26 at 12.59.41 (1).jpeg", "ruby-flower-detail"],
    ["WhatsApp Image 2026-09-26 at 12.59.42 (2).jpeg", "gold-earring-detail"],
    ["WhatsApp Image 2026-09-26 at 12.59.42.jpeg", "pendant-detail"],
  ] },
};
sharp.concurrency(2);
const exports = [];
for (const [slug, group] of Object.entries(groups)) {
  const output = path.join("public/work", slug, "curated");
  await fs.mkdir(output, { recursive: true });
  for (const [source, name] of group.files) {
    const input = path.join(group.folder, source);
    const file = `/work/${slug}/curated/${name}.webp`;
    const image = await sharp(input).rotate().resize(2000, 1800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, effort: 5 }).toFile(`public${file}`);
    exports.push({ slug, source: input, file, width: image.width, height: image.height,
      bytes: image.size, sourceBytes: (await fs.stat(input)).size });
  }
}
const manifestPath = "docs/case-media-sources.json";
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
Object.entries(groups).forEach(([slug, group]) => { manifest.sourceFolders[slug] = group.folder; });
manifest.assets = [...manifest.assets.filter(asset => !Object.hasOwn(groups, asset.slug)), ...exports];
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${exports.length} whole-image WebP exports, ${(exports.reduce((n, asset) => n + asset.bytes, 0) / 1048576).toFixed(2)} MB total`);
