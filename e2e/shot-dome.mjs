import { chromium } from "playwright";

const base = process.env.BASE || "http://localhost:3009";
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.setDefaultTimeout(120000);
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(4500);

async function cap(sel, name) {
  const el = await page.$(sel);
  if (!el) { console.log("MISSING", sel); return; }
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(2000);
  const box = await el.boundingBox();
  await page.mouse.move(5, 5, { steps: 3 });
  await page.waitForTimeout(700);
  await el.screenshot({ path: `/tmp/dome-${name}-rest.png` });
  console.log("shot rest", name);
  // hover: move cursor into the band and settle so pixels light up
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.42, { steps: 12 });
  await page.waitForTimeout(450);
  await el.screenshot({ path: `/tmp/dome-${name}-hover.png` });
  console.log("shot hover", name);
}

await cap(".brand-band", "brand");
await cap(".stats-band", "stats");
await browser.close();
console.log("done");
