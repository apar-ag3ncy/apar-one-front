import fs from "node:fs";
import path from "node:path";

/** Which case images actually exist on disk. The case page is statically
 *  generated, so this runs at build time and lets <PhotoSlot> render the real
 *  <img> only when the file is present - otherwise it shows the drop-zone
 *  placeholder WITHOUT firing a 404. Dropping a file into
 *  /public/work/<slug>/ is still all that's needed for it to appear. */
export interface CaseAssets {
  hero: boolean;
  /** photos[i] = whether /work/<slug>/<i+1>.jpg exists (per gallery index). */
  photos: boolean[];
}

const WORK_DIR = path.join(process.cwd(), "public", "work");

export function caseAssets(slug: string, galleryCount: number): CaseAssets {
  const dir = path.join(WORK_DIR, slug);
  const has = (file: string) => {
    try {
      return fs.existsSync(path.join(dir, file));
    } catch {
      return false;
    }
  };
  return {
    hero: has("hero.jpg"),
    photos: Array.from({ length: galleryCount }, (_, i) => has(`${i + 1}.jpg`)),
  };
}
