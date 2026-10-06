// Verifies the site-wide <PixelTrail> cursor effect actually RENDERS orangish-red
// pixels that follow the cursor, on every page. Method: for each page, park the
// cursor away and screenshot a baseline of a centre band, then stroke the cursor
// through that band and screenshot again. Diff the two: count pixels that BOTH
// turned orange-red AND changed from the baseline. The change-gate cancels out
// the site's static red content (hero dome, accents), so a pass means the moving
// trail itself lit those tiles.
import { chromium } from "playwright";
import { PNG } from "pngjs";

const BASE = process.env.URL || "http://localhost:3021";
const PAGES = ["/", "/what-we-do", "/work", "/clients", "/start"];

const VW = 1366;
const VH = 768;
// centre band we stroke through and measure (below the 84px nav)
const CLIP = { x: 220, y: 330, width: 900, height: 240 };
const STROKE_Y = 450;

// an orange-red trail tile: red-dominant, warm, not a dark/grey/pink pixel
const isOrangeRed = (r, g, b) => r > 150 && r - g > 45 && g - b >= -12 && r - b > 70;
// "changed enough from baseline" - excludes static red content that was already there
const changed = (r, g, b, r0, g0, b0) =>
  Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) > 45;

const countNewOrange = (baseBuf, shotBuf) => {
  const a = PNG.sync.read(baseBuf);
  const c = PNG.sync.read(shotBuf);
  let neo = 0;
  let anyOrange = 0;
  const n = Math.min(a.data.length, c.data.length);
  for (let i = 0; i < n; i += 4) {
    const r = c.data[i], g = c.data[i + 1], b = c.data[i + 2];
    if (isOrangeRed(r, g, b)) {
      anyOrange++;
      const r0 = a.data[i], g0 = a.data[i + 1], b0 = a.data[i + 2];
      if (changed(r, g, b, r0, g0, b0)) neo++;
    }
  }
  return { neo, anyOrange };
};

const rest = async (page) => {
  // park cursor at top-right corner, away from the centre band, and let the
  // trail fully fade + park (LIFE 0.5s + margin)
  await page.mouse.move(VW - 20, 20, { steps: 6 });
  await page.waitForTimeout(1300);
};

const stroke = async (page) => {
  // enter from the left, sweep across the band, settle a fresh bright head in the
  // middle - NO delay before the screenshot so the trail is still lit (RAF runs
  // ~0.58s after the last move before parking)
  await page.mouse.move(CLIP.x - 40, STROKE_Y, { steps: 3 });
  await page.mouse.move(CLIP.x + CLIP.width + 40, STROKE_Y, { steps: 36 });
  await page.mouse.move(VW / 2, STROKE_Y, { steps: 12 });
};

const run = async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const context = await browser.newContext({
    viewport: { width: VW, height: VH },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  const results = [];
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(path === "/" ? 3000 : 1600); // intro lift / settle

    // sanity: the effect must actually be mounted + running (not gated off)
    const mounted = await page.evaluate(() => {
      const c = document.querySelector(".pixel-trail canvas");
      if (!c) return { ok: false, why: "no .pixel-trail canvas" };
      const gl = c.getContext("webgl") || c.getContext("webgl2");
      return { ok: true, hasGL: !!gl, w: c.width, h: c.height };
    });

    // scroll to a negative-space band mid-page, then measure
    await page.evaluate(() => window.scrollTo({ top: Math.round(document.body.scrollHeight * 0.55), behavior: "instant" }));
    await page.waitForTimeout(400);

    await rest(page);
    const baseBuf = await page.screenshot({ clip: CLIP });
    await stroke(page);
    const shotBuf = await page.screenshot({ clip: CLIP });

    const { neo, anyOrange } = countNewOrange(baseBuf, shotBuf);
    const pass = mounted.ok && neo >= 120;
    results.push({ path, pass, newOrange: neo, anyOrange, mounted });
    console.log(
      `${pass ? "PASS" : "FAIL"}  ${path.padEnd(14)} newOrange=${String(neo).padStart(6)}  anyOrange=${String(anyOrange).padStart(6)}  ${mounted.ok ? `gl=${mounted.hasGL}` : mounted.why}`,
    );
  }

  console.log("\nconsole/page errors:", errors.length ? errors.slice(0, 6) : "none");
  const failed = results.filter((r) => !r.pass);
  console.log(
    failed.length === 0
      ? `\nVERDICT: PASS — orangish-red pixel trail renders and follows the cursor on all ${PAGES.length} pages.`
      : `\nVERDICT: FAIL — no cursor trail detected on: ${failed.map((r) => r.path).join(", ")}`,
  );

  await browser.close();
  process.exit(failed.length === 0 ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
