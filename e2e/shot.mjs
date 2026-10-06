import { chromium } from "playwright";

const slugs = process.env.SLUGS ? process.env.SLUGS.split(",") : ["chheda", "girvaan", "achal"];
const base = process.env.BASE || "http://localhost:3001";

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

for (const s of slugs) {
  await page.goto(`${base}/work/${s}`, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  const g = await page.$(".case-gallery");
  if (g) {
    await g.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await g.screenshot({ path: `/tmp/case-${s}.png` });
    console.log(`shot gallery ${s}`);
  }
  // also grab the hero
  const hero = await page.$(".case-hero-fig");
  if (hero) {
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await hero.screenshot({ path: `/tmp/hero-${s}.png` });
    console.log(`shot hero ${s}`);
  }
}
await browser.close();
console.log("done");
