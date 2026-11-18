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

  // The same photo-coloured mosaic must work on the lower work-grid rows too.
  for (const slug of ["a-paramount", "maison-mireyaa"]) {
    const frame = page.locator(`.flow-project[href="/work/${slug}"] .flow-project-image`);
    await frame.scrollIntoViewIfNeeded();
    await frame.locator(".photo-slot-img").evaluate(img => img.decode());
    await page.waitForFunction(selector => document.querySelector(selector)?.dataset.motionReady === "true",
      `.flow-project[href="/work/${slug}"] .flow-project-image`);
    await page.waitForTimeout(700);
    const box = await frame.boundingBox();
    await page.mouse.move(box.x + box.width * .3, box.y + box.height * .5);
    await page.mouse.move(box.x + box.width * .65, box.y + box.height * .5, { steps: 10 });
    await page.waitForFunction(() => document.documentElement.dataset.onImage === "1");
    assert.equal(await page.evaluate(() => document.querySelector(".featured-media-plane").getContext("webgl").getError()), 0);
    await page.screenshot({ path: `reports/motion/${slug}-pixel-hover.png` });
    await page.mouse.move(5, 450);
    await page.waitForFunction(() => !document.documentElement.dataset.onImage);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `reports/motion/${slug}-restored.png` });
  }

  // A graphics failure restores the actual photographs immediately.
  await page.evaluate(() => {
    document.querySelector(".featured-media-plane").getContext("webgl")
      .getExtension("WEBGL_lose_context").loseContext();
  });
  await page.waitForFunction(() => !document.querySelector(".flow-project-image[data-motion-ready]"));
  assert.equal(await images.first().locator(".flow-project-art").evaluate(el => getComputedStyle(el).opacity), "1");
  await images.first().scrollIntoViewIfNeeded();
  const fallback = await images.first().boundingBox();
  await page.mouse.move(fallback.x + fallback.width * .5, fallback.y + fallback.height * .5);
  await images.first().locator(".image-pixel-trail").waitFor({ state: "visible" });
  await page.mouse.move(5, 450);
  await page.waitForFunction(() => !document.documentElement.dataset.onImage);

  // Live breakpoint changes must remove the renderer and restore untransformed text.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.querySelector(".featured-media-plane"));
  assert.equal(await page.locator(".pixel-trail").evaluate(el => getComputedStyle(el).display), "none");
  const phoneFirst = await images.nth(0).boundingBox();
  const phoneSecond = await images.nth(1).boundingBox();
  assert.ok(phoneFirst && phoneSecond, "phone photographs must retain their frames");
  assert.ok(phoneSecond.y > phoneFirst.y + phoneFirst.height);
  const phoneSpacing = await page.locator('.flow-project').evaluateAll(cards => cards.slice(0, 2).map(card => {
    const box = card.getBoundingClientRect();
    const image = card.querySelector('.flow-project-image').getBoundingClientRect();
    const caption = card.querySelector('.flow-project-caption');
    const captionBox = caption.getBoundingClientRect();
    return { left: image.left, right: innerWidth - image.right, top: box.top, bottom: box.bottom,
      leadingSpace: image.top - box.top, trailingSpace: box.bottom - captionBox.bottom,
      captionGap: parseFloat(getComputedStyle(caption).paddingTop) };
  }));
  for (const card of phoneSpacing) {
    assert(Math.abs(card.left - card.right) < 1 && card.left >= 20 && card.left <= 28, 'phone images have balanced reference gutters');
    assert(Math.abs(card.leadingSpace) < 1 && Math.abs(card.trailingSpace) < 1, 'no viewport-height padding around phone cards');
    assert.equal(card.captionGap, 16);
  }
  const cardGap = phoneSpacing[1].top - phoneSpacing[0].bottom;
  assert(cardGap >= 32 && cardGap <= 40, `natural card spacing: ${cardGap}px`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: "reports/motion/phone.png" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".featured-media-plane"));
  assert.equal(await images.first().locator(".flow-project-art").evaluate(el => getComputedStyle(el).opacity), "1");
  assert.deepEqual(errors, []);
  console.log("PASS: grid alignment, image-pixel hover, graphics fallback, phone and reduced-motion checks.");
} finally {
  await browser.close();
}
