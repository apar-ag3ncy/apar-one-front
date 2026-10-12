import fs from "node:fs";
import path from "node:path";
import { CURATED_CASE_MEDIA } from "./case-motion";

/** Which case images actually exist on disk. The case page is statically
 *  generated, so this runs at build time and lets <PhotoSlot> render the real
 *  <img> only when the file is present - otherwise it shows the client's
 *  identity WITHOUT firing a 404. Dropping a file into
 *  /public/work/<slug>/ is still all that's needed for it to appear. */
export interface CaseAssets {
  hero: boolean;
  heroSrc?: string;
  heroRatio?: number;
  /** photos[i] = whether curated or /work/<slug>/<i+1>.jpg artwork exists. */
  photos: boolean[];
  photoSrcs: (string | undefined)[];
  photoRatios: (number | undefined)[];
}

const WORK_DIR = path.join(process.cwd(), "public", "work");

/** Read dimensions from our JPEG/WebP headers at build time; no client fetch or image decode. */
function ratioOf(src: string | undefined): number | undefined {
  if (!src) return;
  try {
    const b = fs.readFileSync(path.join(process.cwd(), "public", src));
    if (b.toString("ascii", 0, 4) === "RIFF") {
      const kind = b.toString("ascii", 12, 16);
      if (kind === "VP8X") return (b.readUIntLE(24, 3) + 1) / (b.readUIntLE(27, 3) + 1);
      if (kind === "VP8 ") return (b.readUInt16LE(26) & 0x3fff) / (b.readUInt16LE(28) & 0x3fff);
      if (kind === "VP8L") { const bits = b.readUInt32LE(21); return ((bits & 0x3fff) + 1) / (((bits >>> 14) & 0x3fff) + 1); }
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let p = 2;
      while (p + 9 < b.length) {
        if (b[p] !== 0xff) break;
        const marker = b[p + 1];
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return b.readUInt16BE(p + 7) / b.readUInt16BE(p + 5);
        const length = b.readUInt16BE(p + 2);
        if (length < 2) break;
        p += length + 2;
      }
    }
  } catch { /* A missing/corrupt asset retains the branded static frame. */ }
}

export function caseAssets(slug: string, galleryCount: number): CaseAssets {
  const dir = path.join(WORK_DIR, slug);
  const has = (file: string) => {
    try {
      return fs.existsSync(path.join(dir, file));
    } catch {
      return false;
    }
  };
  const curated = CURATED_CASE_MEDIA[slug];
  const exists = (src: string) => fs.existsSync(path.join(process.cwd(), "public", src));
  const heroSrc = curated?.hero && exists(curated.hero) ? curated.hero : has("hero.jpg") ? `/work/${slug}/hero.jpg` : undefined;
  const photoSrcs = Array.from({ length: galleryCount }, (_, i) => {
    const src = curated?.photos[i];
    return src && exists(src) ? src : has(`${i + 1}.jpg`) ? `/work/${slug}/${i + 1}.jpg` : undefined;
  });
  return { hero: !!heroSrc, heroSrc, heroRatio: ratioOf(heroSrc), photos: photoSrcs.map(Boolean), photoSrcs, photoRatios: photoSrcs.map(ratioOf) };
}
