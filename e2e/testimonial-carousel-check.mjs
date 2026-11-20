import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.URL || "http://127.0.0.1:3021";
const browser = await chromium.launch({
  ...(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : { channel: "chrome" }),
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(String(error)));
const gallery = page.locator(".tc-gallery");
const storyCount = 14;
const settledAt = index => page.waitForFunction(index => {
  const root = document.querySelector(".tc-gallery");
  const card = root?.children[index];
  return card?.dataset.active === "true" &&
    Math.abs(root.scrollLeft - (card.offsetLeft - root.children[0].offsetLeft)) < 2;
}, index);

try {
  await page.goto(`${base}/#testimonials`, { waitUntil: "domcontentloaded" });
  await gallery.scrollIntoViewIfNeeded();
  await gallery.hover(); // Pause automatic advancement during manual checks.
  await settledAt(0);
  assert.equal(await page.locator(".tc-story").count(), storyCount);
  assert.equal(await page.getByRole("button", { name: "Leave APĀR a private voice note" }).count(), 1);
  assert.equal(await page.getByRole("button", { name: /Previous brand story|Next brand story/ }).count(), 0);
  assert.match(await page.locator('#tc-story-manish-jewellers').innerText(), /Campaign line/i);

  const initialRect = await gallery.boundingBox();
  await page.mouse.move(initialRect.x + initialRect.width * .7, initialRect.y + 160);
  await page.mouse.down();
  await page.mouse.move(initialRect.x + initialRect.width * .3, initialRect.y + 160, { steps: 12 });
  await page.mouse.up();
  await settledAt(1);
  await gallery.focus();
  await page.keyboard.press("Home");
  await settledAt(0);

  for (let index = 1; index < storyCount; index++) {
    await page.keyboard.press("ArrowRight");
    await settledAt(index);
  }
  await page.keyboard.press("ArrowRight");
  await settledAt(storyCount - 1);
  await page.keyboard.press("Home");
  await settledAt(0);
  for (let index = 1; index <= 10; index++) {
    await page.keyboard.press("ArrowRight");
    await settledAt(index);
  }

  // A vertical gesture continues down the page, without selecting another story.
  const rect = await gallery.boundingBox();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 200);
  await page.mouse.wheel(0, 240);
  await page.waitForFunction(before => scrollY > before + 50, before);
  await settledAt(10);

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await settledAt(10);
    const layout = await page.locator(".tc-copy").evaluateAll(cards => ({
      clipped: cards.some(card => card.scrollHeight > card.clientHeight + 1),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    assert.deepEqual(layout, { clipped: false, overflow: false }, `Layout at ${width}px`);
    if (width <= 900) {
      assert.equal(await page.locator(".tc-copy").first().evaluate(el => getComputedStyle(el).backdropFilter), "none");
    }
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await gallery.focus();
  await page.keyboard.press("End");
  await settledAt(storyCount - 1);
  await page.keyboard.press("Home");
  await settledAt(0);
  assert.equal(await page.locator(".tc-pause").count(), 0);

  // Restore motion and release both focus and hover so autoplay may advance.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gallery.evaluate(el => el.blur());
  await page.mouse.move(0, 0);
  await gallery.scrollIntoViewIfNeeded();
  await settledAt(1);
  const pause = page.getByRole("button", { name: "Pause automatic stories" });
  await pause.click();
  assert.equal(await page.getByRole("button", { name: "Resume automatic stories" }).count(), 1);
  assert.deepEqual(errors, []);
  console.log("PASS: 14 stories, mouse drag, keyboard navigation, vertical scrolling, responsive quotes, reduced motion and autoplay");
} finally {
  await browser.close();
}
