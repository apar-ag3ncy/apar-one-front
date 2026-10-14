import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.URL || "http://127.0.0.1:3021";
const output = process.env.OUTPUT || "/private/tmp/apar-manifesto";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : { channel: "chrome" }), headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const errors = [], checks = [];
page.on("pageerror", error => errors.push(String(error)));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) errors.push(`${response.status()} ${response.url()}`); });
async function check(name, callback) { await callback(); checks.push(name); console.log(`PASS ${name}`); }
async function settle() { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1000); }
async function progressTo(progress) {
  await page.locator(".manifesto-journey").evaluate((el, p) => {
    const top = el.getBoundingClientRect().top + scrollY;
    const start = top - 84, end = top + el.offsetHeight - innerHeight;
    scrollTo({ top: start + (end - start) * p, behavior: "instant" });
  }, progress);
  await page.waitForFunction(p => Math.abs(Number(document.querySelector(".manifesto-journey").dataset.progress) - p) < .02, progress);
  await page.waitForTimeout(850);
}
try {
  await page.goto(base + "/manifesto", { waitUntil: "load" }); await settle();
  await check("dedicated route, original fonts and three meaningful chapters", async () => {
    assert.match(await page.title(), /Manifesto.*APAR/);
    assert.equal(await page.locator(".manifesto-chapter").count(), 3);
    assert.equal(await page.locator(".manifesto-tile").count(), 81);
    assert.match(await page.locator("h1").evaluate(el => getComputedStyle(el).fontFamily), /Archivo/);
    assert.equal(await page.locator('.nav-links a[href="/manifesto"]').getAttribute("aria-current"), "page");
  });
  await page.screenshot({ path: `${output}/opening-desktop.png` });
  let firstState;
  await check("scroll changes the chapter and pixel composition", async () => {
    assert.equal(await page.locator(".manifesto-journey").getAttribute("data-motion"), "cinematic");
    for (const [progress, chapter] of [[.16, 0], [.5, 1], [.88, 2]]) {
      await progressTo(progress);
      assert.equal(await page.locator(".manifesto-step").nth(chapter).getAttribute("data-active"), "true");
      assert.equal(await page.locator(".manifesto-chapter").nth(chapter).evaluate(el => getComputedStyle(el).visibility), "visible");
      const state = await page.locator(".manifesto-tile").first().getAttribute("transform");
      if (chapter === 0) firstState = state;
      else assert.notEqual(state, firstState, "The graphic must visibly morph with scroll");
      const top = await page.locator(".manifesto-stage").evaluate(el => el.getBoundingClientRect().top);
      assert(Math.abs(top - 84) < 2, `sticky stage at ${top}`);
      const centred = await page.locator(".manifesto-orbit").evaluate(svg => {
        const circle = svg.querySelector(".manifesto-orbit-outer").getBoundingClientRect();
        const frame = svg.querySelector(".manifesto-orbit-inner").getBoundingClientRect();
        return Math.abs(circle.x + circle.width / 2 - frame.x - frame.width / 2) < 1
          && Math.abs(circle.y + circle.height / 2 - frame.y - frame.height / 2) < 1;
      });
      assert(centred, "Rotating outline must remain centred on the pixel composition");
      await page.screenshot({ path: `${output}/chapter-${chapter + 1}.png` });
    }
  });
  await check("reverse scroll restores the first belief", async () => {
    await progressTo(.15);
    assert.equal(await page.locator(".manifesto-step").first().getAttribute("data-active"), "true");
    assert.equal(await page.locator(".manifesto-chapter").first().evaluate(el => getComputedStyle(el).visibility), "visible");
  });
  await check("live reduced motion restores all copy without sticky trapping", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.waitForTimeout(500);
    assert.equal(await page.locator(".manifesto-journey").getAttribute("data-motion"), null);
    assert(await page.locator(".manifesto-chapter").evaluateAll(items => items.every(el => getComputedStyle(el).visibility === "visible" && getComputedStyle(el).opacity === "1")));
  });
  for (const [width, height] of [[320, 740], [390, 844], [768, 1024], [1440, 500]]) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height });
    await page.goto(base + "/manifesto", { waitUntil: "load" }); await settle();
    await check(`${width}x${height}: readable native layout without overflow`, async () => {
      assert.equal(await page.locator(".manifesto-journey").getAttribute("data-motion"), null);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const bounds = await page.locator(".manifesto-chapter").evaluateAll(items => items.map(el => el.getBoundingClientRect().top));
      assert(bounds[0] < bounds[1] && bounds[1] < bounds[2]);
      await page.locator(".manifesto-chapter").last().scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
      assert.equal(await page.locator(".manifesto-chapter").last().evaluate(el => getComputedStyle(el).visibility), "visible");
    });
    if (width === 390) { await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await page.waitForTimeout(500); await page.screenshot({ path: `${output}/manifesto-mobile.png`, fullPage: true }); }
  }
  await check("mobile menu opens the standalone Manifesto", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: "load" }); await settle();
    await page.locator(".nav-burger").click(); await page.waitForTimeout(700);
    await page.locator('.mobile-menu a[href="/manifesto"]').click();
    await page.waitForURL("**/manifesto"); await settle();
    assert.equal(await page.locator(".manifesto-page").count(), 1);
    assert.equal(await page.locator(".mobile-menu").evaluate(el => el.classList.contains("open")), false);
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: "load" }); await settle();
  await check("Manifesto moved off home; featured image pairs stay unchanged", async () => {
    assert.equal(await page.locator("#manifesto").count(), 0);
    assert.equal(await page.locator(".flow-project").count(), 12);
    const geometry = await page.locator(".flow-project-image").evaluateAll(items => items.map(el => { const r = el.getBoundingClientRect(); return { y: r.y, w: r.width, h: r.height }; }));
    for (let i = 0; i < geometry.length; i += 2) {
      assert(Math.abs(geometry[i].y - geometry[i + 1].y) < 1);
      assert(Math.abs(geometry[i].w - geometry[i + 1].w) < 1);
      assert(Math.abs(geometry[i].w / geometry[i].h - 20 / 13) < .01);
    }
    await page.locator('.nav-links a[href="/manifesto"]').click(); await page.waitForURL("**/manifesto"); await settle();
    assert.equal(await page.locator(".manifesto-page").count(), 1);
  });
  await check("route changes and return navigation leave no hidden chapters", async () => {
    await progressTo(.85);
    await page.locator('.nav-links a[href="/work"]').click(); await page.waitForURL("**/work"); await settle();
    assert.equal(await page.locator(".manifesto-stage").count(), 0);
    await page.locator('.nav-links a[href="/manifesto"]').click(); await page.waitForURL("**/manifesto"); await settle();
    await progressTo(.18);
    assert.equal(await page.locator(".manifesto-chapter").first().evaluate(el => getComputedStyle(el).visibility), "visible");
  });
  assert.deepEqual(errors, [], "Console, runtime and network errors");
  await fs.writeFile(`${output}/results.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(`PASS ${checks.length} checks; no console/runtime/HTTP errors`);
} finally { await browser.close(); }
