import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.URL || "http://127.0.0.1:3021";
const output = process.env.OUTPUT || "/private/tmp/apar-case-motion";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : { channel: "chrome" }),
  headless: true,
});
const errors = [], failures = [], checks = [], warnings = new Set();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await context.newPage();
page.on("pageerror", error => errors.push(String(error)));
page.on("console", message => {
  if (message.type() === "error") errors.push(message.text());
  if (message.type() === "warning") {
    // Logo script / oblique cuts are intentionally prepared before their turn
    // in the choreography. Report these preload advisories separately; GSAP,
    // WebGL and other runtime warnings still fail the regression.
    if (message.text().includes("was preloaded using link preload but not used")) warnings.add(message.text());
    else errors.push(message.text());
  }
});
page.on("response", response => { if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) errors.push(`${response.status()} ${response.url()}`); });

const geometry = () => page.evaluate(() => ({
  width: innerWidth, height: innerHeight,
  overflow: document.documentElement.scrollWidth - innerWidth,
  pinned: document.querySelector(".case-work-journey")?.dataset.pinned === "true",
  progress: Number(document.querySelector(".case-work-journey")?.dataset.progress || 0),
  count: document.querySelector(".case-reel-progress > span")?.textContent,
  railScroll: document.querySelector(".case-reel-viewport")?.scrollLeft,
  stageTop: document.querySelector(".case-reel-stage")?.getBoundingClientRect().top,
  canvases: document.querySelectorAll(".brand-signature canvas").length,
  brokenImages: Array.from(document.images).filter(image => image.complete && !image.naturalWidth).map(image => image.src),
}));
const settle = () => page.waitForTimeout(1500);
const whiteStory = () => page.evaluate(() => {
  const colour = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const darkInk = el => {
    context.clearRect(0, 0, 1, 1); context.fillStyle = getComputedStyle(el).color; context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return Math.max(r, g, b) <= 60 && a === 255;
  };
  return colour(".case-page", "backgroundColor") === "rgb(255, 255, 255)"
    && colour("body", "backgroundColor") === "rgb(255, 255, 255)"
    && colour(".case-next", "backgroundColor") === "rgb(255, 255, 255)"
    && !document.querySelector(".nav.on-dark, .case-page .lg-backdrop")
    && [...document.querySelectorAll(".case-title, .case-title em, .case-eyebrow, .case-sub, .case-meta h4, .case-meta p, .case-tag, .case-lead em, .case-cols h3, .case-cols p, .case-list li, .case-reel-intro h2 em, .case-reel-panel figcaption, .case-stat .n, .case-stat .l, .case-quote blockquote, .case-quote em, .case-quote .by, .case-next .nx-name, .case-next .nx-l, .nav-links a")].every(darkInk)
    && [...document.querySelectorAll(".case-ph-mask")].every(el => getComputedStyle(el).backgroundColor === "rgb(17, 17, 17)");
});
const heroKeepsRatio = () => page.locator(".case-hero-fig").evaluate(frame => {
  const image = frame.querySelector(".photo-slot-img");
  if (!image?.naturalWidth) return true;
  const rect = frame.getBoundingClientRect();
  const natural = image.naturalWidth / image.naturalHeight;
  return Math.abs(rect.width / rect.height - natural) / natural < .01;
});
const check = async (name, test) => {
  try { await test(); checks.push({ name, pass: true }); console.log(`PASS ${name}`); }
  catch (error) {
    const state = await geometry();
    const targets = await page.evaluate(() => ({
      resultTop: document.getElementById("case-results")?.getBoundingClientRect().top,
      scroll: scrollY, wipe: document.querySelector(".page-wipe")?.getAttribute("style"),
    }));
    failures.push({ name, error: String(error), state, targets });
    console.log(`FAIL ${name}: ${error} ${JSON.stringify({ state, targets })}`);
    await page.screenshot({ path: output + "/failure-" + failures.length + ".png" });
  }
};

try {
  await page.goto(base + "/clients", { waitUntil: "load" });
  const allRoutes = await page.locator(".client-story-link").evaluateAll(links => links.map(link => new URL(link.href).pathname));
  assert.equal(allRoutes.length, 12);
  const routes = process.env.CASE_FILTER ? allRoutes.filter(route => new RegExp(process.env.CASE_FILTER).test(route)) : allRoutes;
  await check("client card hover and keyboard focus", async () => {
    const card = page.locator(".client-story-link").first();
    await card.hover(); await settle();
    const hovered = await card.evaluate(link => ({
      scale: Number(getComputedStyle(link.querySelector(".client-story-art")).transform.match(/matrix\(([^,]+)/)?.[1]),
      visible: Number(getComputedStyle(link.querySelector(".client-story-explore")).opacity),
    }));
    assert(hovered.scale > 1.04); assert.equal(hovered.visible, 1);
    await page.mouse.move(10, 100); await card.focus(); await settle();
    assert.equal(await card.evaluate(link => Number(getComputedStyle(link.querySelector(".client-story-explore")).opacity)), 1);
    await page.screenshot({ path: output + "/clients-desktop.png" });
    await card.click();
    await page.locator(".page-wipe").waitFor({ state: "visible" });
    assert.equal(await page.locator(".page-wipe").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
    await page.waitForURL("**/work/chheda");
    await page.locator(".page-wipe").waitFor({ state: "detached", timeout: 7000 });
    await settle();
    assert(Math.abs(await page.evaluate(() => scrollY)) <= 1, "New case must open at the top");
    assert(await whiteStory(), "Card navigation must reveal a white story with dark text");
  });

  for (const route of (process.env.NATIVE_ONLY ? [] : routes)) await check(`${process.env.THEME_ONLY ? "white theme" : "desktop"} ${route}`, async () => {
    await page.goto(base + route, { waitUntil: "load" }); await settle();
    const initial = await geometry();
    assert(await whiteStory(), "Every case surface, text tier and fallback must follow the white theme");
    assert(initial.pinned); assert(initial.overflow <= 1); assert.deepEqual(initial.brokenImages, []);
    assert(await heroKeepsRatio(), "Hero artwork must retain its original proportions");
    assert.equal(await page.locator(".case-reel-panel").count() > 0, true);
    if (process.env.THEME_ONLY) return;
    if (["/work/chheda", "/work/a-paramount"].includes(route)) {
      assert.equal(await page.locator(".case-reel-panel").count(), 8);
      assert.equal(await page.locator(".case-reel-panel.is-identity").count(), 0, "Supplied image stories must contain no logo-only gallery panels");
      await page.screenshot({ path: output + `/${route.split("/").pop()}-opening.png` });
    }
    if (route === "/work/maison-mireyaa") await page.screenshot({ path: output + "/case-opening.png" });
    await page.locator(".case-explore").click(); await settle();
    await page.mouse.wheel(0, 650); await settle();
    const forward = await geometry();
    assert(forward.progress > .03); assert(Math.abs(forward.stageTop - 80) < 2);
    assert.equal(forward.canvases, 1);
    if (route === "/work/maison-mireyaa") await page.screenshot({ path: output + "/case-gallery.png" });
    await page.mouse.wheel(0, -450); await settle();
    assert((await geometry()).progress < forward.progress);
    await page.getByRole("button", { name: "Next artwork", exact: true }).click(); await settle();
    assert((await geometry()).progress > 0);
    assert.deepEqual((await geometry()).brokenImages, []);
    if (["/work/chheda", "/work/a-paramount"].includes(route)) {
      await page.waitForFunction(() => [...document.querySelectorAll(".case-reel-panel .photo-slot-img")].every(image => image.complete && image.naturalWidth > 0));
      await page.screenshot({ path: output + `/${route.split("/").pop()}-gallery.png` });
    }
    // Representative full journeys cover mixed artwork widths and the actual
    // film panel, as well as the beginning/end scroll tests on every story.
    if (["/work/maison-mireyaa", "/work/girvaan", "/work/chheda", "/work/a-paramount"].includes(route)) {
      const total = await page.locator(".case-reel-panel").count();
      for (let i = 0; i <= total; i++) {
        await page.getByRole("button", { name: "Next artwork", exact: true }).click(); await settle();
      }
      assert.equal(Number((await geometry()).count), total, "The last artwork must be selectable and counted");
      if (["/work/chheda", "/work/a-paramount"].includes(route)) {
        assert(await page.locator(".case-reel-panel").evaluateAll(panels => panels.every(panel => {
          const image = panel.querySelector(".photo-slot-img"), visual = panel.querySelector(".case-panel-visual");
          return image?.naturalWidth > 0 && Math.abs(visual.offsetWidth / visual.offsetHeight - image.naturalWidth / image.naturalHeight) < .01;
        })), "All eight artwork frames must retain the supplied photograph's proportions");
      }
      if (route === "/work/girvaan") {
        await page.locator(".case-reel-panel video").waitFor({ state: "visible" });
        await page.waitForFunction(() => document.querySelector(".case-reel-panel video")?.readyState >= 2, null, { timeout: 10000 });
      }
    }
    await page.getByRole("link", { name: "Skip to the results ↗", exact: true }).click(); await settle();
    const landed = await page.locator("#case-results").evaluate(el => el.getBoundingClientRect().top);
    if (Math.abs(landed - 80) >= 3) await page.waitForFunction(
      () => Math.abs(document.getElementById("case-results").getBoundingClientRect().top - 80) < 3,
      null, { timeout: 10000, polling: 100 });
    const resultTop = await page.locator("#case-results").evaluate(el => el.getBoundingClientRect().top);
    assert(Math.abs(resultTop - 80) < 3, `Results anchor is ${resultTop}px from the top`);
  });

  for (const size of (process.env.DESKTOP_ONLY ? [] : [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 500 }])) {
    await page.setViewportSize(size);
    for (const route of routes) await check(`${size.width}x${size.height} ${route}`, async () => {
      await page.goto(base + route, { waitUntil: "load" }); await page.waitForTimeout(350);
      assert(await whiteStory(), "Responsive case pages must retain the white theme");
      if (size.width === 390) {
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        await page.waitForTimeout(650);
        assert.equal(await page.locator(".mobile-menu").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
        assert(await page.locator(".mobile-menu a").evaluateAll(links => links.every(link => getComputedStyle(link).color === "rgb(17, 17, 17)")));
        assert.equal(await page.locator(".nav-burger span").first().evaluate(el => getComputedStyle(el).backgroundColor), "rgb(17, 17, 17)");
        await page.getByRole("button", { name: "Close menu", exact: true }).click();
        await page.waitForTimeout(650);
      }
      assert.equal((await geometry()).pinned, false);
      assert((await geometry()).overflow <= 1);
      assert(await heroKeepsRatio(), "Responsive hero must retain its original proportions");
      await page.locator(".case-explore").click(); await settle();
      const introFits = await page.locator(".case-reel-intro").evaluate(el => {
        const a = el.getBoundingClientRect(), b = el.closest(".case-reel-viewport").getBoundingClientRect();
        return a.top >= b.top && a.bottom <= b.bottom;
      });
      assert(introFits, "Brand introduction must fit vertically in the native rail");
      const artworkFits = await page.locator(".case-reel-panel").evaluateAll(panels => panels.every(panel => {
        const a = panel.getBoundingClientRect(), b = panel.closest(".case-reel-viewport").getBoundingClientRect();
        return a.top >= b.top && a.bottom <= b.bottom;
      }));
      assert(artworkFits, "Whole artwork and captions must fit vertically in the native rail");
      await page.getByRole("button", { name: "Next artwork", exact: true }).click(); await settle();
      const moved = await geometry();
      assert(moved.railScroll > 0); assert(moved.progress > 0); assert(moved.overflow <= 1);
      assert.deepEqual(moved.brokenImages, []);
      if (size.width === 390 && route === "/work/maison-mireyaa") await page.screenshot({ path: output + "/case-mobile.png" });
      if (size.width === 390 && ["/work/chheda", "/work/a-paramount"].includes(route))
        await page.screenshot({ path: output + `/${route.split("/").pop()}-mobile.png` });
    });
  }

  await check("next-case transition and white-page scroll reset", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + "/work/chheda"); await settle();
    await page.locator(".case-next .nx").click();
    await page.waitForURL("**/work/girvaan");
    await page.locator(".page-wipe").waitFor({ state: "detached", timeout: 7000 });
    await settle();
    assert(await whiteStory());
    assert(Math.abs(await page.evaluate(() => scrollY)) <= 1, "Next white story must start at the top");
  });

  await check("live reduced-motion and breakpoint cleanup", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + "/work/chheda"); await settle();
    await page.locator(".case-explore").click(); await settle(); await page.mouse.wheel(0, 500); await settle();
    assert((await geometry()).pinned);
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.waitForTimeout(400);
    assert.equal((await geometry()).pinned, false);
    assert.equal((await geometry()).canvases, 0);
    assert.equal(await page.locator(".case-work-journey .pin-spacer").count(), 0);
    assert.equal(await page.locator(".case-hero-media").evaluate(el => getComputedStyle(el).opacity), "1");
    await page.emulateMedia({ reducedMotion: "no-preference" }); await settle();
    assert((await geometry()).pinned); assert((await geometry()).canvases <= 1);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
    assert.equal((await geometry()).pinned, false);
    assert((await geometry()).overflow <= 1);
  });
} finally {
  await fs.writeFile(output + "/results.json", JSON.stringify({ checks, failures, errors, warnings: [...warnings] }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ passed: checks.length, failed: failures.length, errors, preloadAdvisories: warnings.size, output }, null, 2));
if (failures.length || errors.length) process.exitCode = 1;
