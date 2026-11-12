// Run only against a browser-approved preview. A build is not visual proof.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.URL || "http://127.0.0.1:3021";
const browser = await chromium.launch({
  ...(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : { channel: "chrome" }),
  headless: process.env.HEADLESS === "1",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await fs.mkdir("reports/motion", { recursive: true });

try {
  await page.goto(`${base}/#featured-work`, { waitUntil: "domcontentloaded" });
  await page.locator(".flow-project-image[data-motion-ready]").first().waitFor();
  assert.equal(await page.locator(".featured-media-plane").count(), 1,
    "all featured cards must share one renderer");
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 400);
  await page.screenshot({ path: "reports/motion/desktop-scroll.png" });
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(1000);
  const images = page.locator(".flow-project-image");
  const first = await images.nth(0).boundingBox();
  const second = await images.nth(1).boundingBox();
  assert.ok(first && second, "the original image frames must remain in the document");
  assert.ok(Math.abs(first.width - second.width) < 1 && Math.abs(first.y - second.y) < 1);

  // A graphics failure restores the actual photographs immediately.
  await page.evaluate(() => {
    document.querySelector(".featured-media-plane").getContext("webgl")
      .getExtension("WEBGL_lose_context").loseContext();
  });
  await page.waitForFunction(() => !document.querySelector(".flow-project-image[data-motion-ready]"));
  assert.equal(await images.first().locator(".flow-project-art").evaluate(el => getComputedStyle(el).opacity), "1");

  // Live breakpoint changes must remove the renderer and restore untransformed text.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.querySelector(".featured-media-plane"));
  assert.equal(await page.locator(".pixel-trail").evaluate(el => getComputedStyle(el).display), "none");
  const phoneFirst = await images.nth(0).boundingBox();
  const phoneSecond = await images.nth(1).boundingBox();
  assert.ok(phoneFirst && phoneSecond, "phone photographs must retain their frames");
  assert.ok(phoneSecond.y > phoneFirst.y + phoneFirst.height);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: "reports/motion/phone.png" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".featured-media-plane"));
  assert.equal(await images.first().locator(".flow-project-art").evaluate(el => getComputedStyle(el).opacity), "1");
  assert.deepEqual(errors, []);
  console.log("PASS: grid alignment, graphics fallback, phone and reduced-motion checks.");
} finally {
  await browser.close();
}
