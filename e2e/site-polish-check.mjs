import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.URL || "http://127.0.0.1:3021";
const output = process.env.OUTPUT || "/private/tmp/apar-site-polish";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : { channel: "chrome" }),
  headless: true,
});
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [], results = [];
page.on("pageerror", error => errors.push(String(error)));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => {
  if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) errors.push(`${response.status()} ${response.url()}`);
});
async function visit(route) {
  const response = await page.goto(base + route, { waitUntil: "load" });
  assert.equal(response.status(), 200, route);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}
async function revealAssets() {
  // Trigger lazy media in their real viewport, including the end of long pages.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .8) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(400);
}
async function check(name, test) {
  await test(); results.push(name); console.log(`PASS ${name}`);
}
try {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit("/work");
  await check("reduced-motion content is visible below the fold without scrolling", async () => {
    assert.equal(await page.locator(".work-card").last().evaluate(el => getComputedStyle(el).opacity), "1");
  });
  await check("Work filters report and display the right projects", async () => {
    for (const [label, count] of [["Jewellery", 3], ["Lifestyle", 2], ["All work", 5]]) {
      await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
      await page.waitForTimeout(200);
      assert.equal(await page.locator(".work-card").count(), count);
      assert.equal(await page.getByRole("button", { name: new RegExp(`^${label}`) }).getAttribute("aria-pressed"), "true");
    }
    assert.equal(await page.getByRole("link", { name: "Work", exact: true }).getAttribute("aria-current"), "page");
  });
  await check("Work masonry has real images with no overlapping cards", async () => {
    await revealAssets();
    const info = await page.locator(".work-card").evaluateAll(cards => cards.map(card => {
      const image = card.querySelector(".photo-slot-img"), box = card.getBoundingClientRect();
      const frame = card.querySelector(".img-slot").getBoundingClientRect();
      return { x: box.x, y: box.y, w: box.width, h: box.height, loaded: image.naturalWidth > 0,
        ratio: frame.width / frame.height };
    }));
    assert(info.every(card => card.loaded && card.ratio > 0));
    for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) {
      const a = info[i], b = info[j];
      assert(!(a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1), `cards ${i}/${j} overlap`);
    }
  });
  for (const size of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    for (const route of ["/", "/work", "/clients", "/what-we-do", "/start", "/team", "/work/chheda", "/work/a-paramount"]) {
      await visit(route);
      await revealAssets();
      await check(`${size.width}px ${route}: no overflow or broken images`, async () => {
        const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth,
          broken: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src) }));
        assert(state.overflow <= 1, JSON.stringify(state));
        assert.deepEqual(state.broken, []);
        if (route === "/") {
          assert.equal(await page.locator(".flow-project").count(), 12);
          assert.equal(await page.locator('img[src*="achal-one-glass"]').count(), 0);
          if (size.width >= 768) {
            const boxes = await page.locator(".flow-project-image").evaluateAll(images => images.map(image => {
              const box = image.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height };
            }));
            for (let i = 0; i < boxes.length; i += 2) {
              const a = boxes[i], b = boxes[i + 1];
              assert(Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1 && b.x > a.x, "Featured images must remain equal, aligned pairs");
            }
          }
        }
        if (route === "/start" && size.width <= 900) {
          const positions = await page.evaluate(() => [".start-head", ".start-aesthetic", ".start-fields"].map(selector => document.querySelector(selector).getBoundingClientRect().top));
          assert(positions[0] < positions[1] && positions[1] < positions[2], `mobile form order: ${positions}`);
        }
      });
      if ((size.width === 1440 && ["/work", "/clients", "/what-we-do"].includes(route)) || (size.width === 390 && ["/work", "/start", "/team"].includes(route))) {
        await page.screenshot({ path: `${output}/${route.slice(1)}-${size.width}.png`, fullPage: true });
      }
    }
  }
  await check("FAQ expands and collapses with keyboard", async () => {
    await visit("/");
    const question = page.locator(".faq-q").first();
    await question.focus(); await page.keyboard.press("Enter");
    assert.equal(await question.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Enter");
    assert.equal(await question.getAttribute("aria-expanded"), "false");
  });
  await check("brief rejects whitespace and accurately explains the email handoff", async () => {
    await visit("/start");
    await page.locator('input[autocomplete="organization"]').fill("   ");
    await page.locator("textarea").fill("   ");
    await page.locator('input[autocomplete="name"]').fill("   ");
    await page.locator('input[type="email"]').fill("preview@example.com");
    await page.locator(".start-submit").click();
    assert.match(await page.locator(".start-error[role=alert]").innerText(), /Please add your brand/);
    await page.locator('input[autocomplete="organization"]').fill("Preview brand");
    await page.locator("textarea").fill("Preview only — no message will be sent.");
    await page.locator('input[autocomplete="name"]').fill("Preview reviewer");
    if ((await page.locator(".start-submit").innerText()).includes("Prepare email")) {
      // Synthetic submission has no user gesture; headless Chrome cannot open
      // an external mail client. No email or API request is sent by this check.
      await page.locator(".start-form").evaluate(form => form.requestSubmit());
      await page.waitForTimeout(200);
      assert.match(await page.locator(".start-done").innerText(), /haven't received it yet/);
      assert.match(await page.getByRole("link", { name: "Open email draft" }).getAttribute("href"), /^mailto:info@apar.agency/);
      await page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async text => { window.__copiedBrief = text; } } });
      });
      await page.getByRole("button", { name: "Copy brief" }).click();
      assert.match(await page.locator(".start-copy-status").innerText(), /Brief copied/);
      assert.match(await page.evaluate(() => window.__copiedBrief), /Brand: Preview brand/);
    }
  });
  assert.deepEqual(errors, [], "console/runtime/HTTP errors");
  await fs.writeFile(`${output}/results.json`, JSON.stringify({ checks: results, errors }, null, 2));
  console.log(`PASS ${results.length} checks; zero console/runtime/HTTP errors`);
} finally { await browser.close(); }
