import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3001/", { waitUntil: "load" });

// capture the logo at a few moments to see the "A" morph + the bigger size
for (const [label, wait] of [
  ["t0", 300],
  ["t1", 500],
  ["t2", 600],
  ["settled", 2500],
]) {
  await page.waitForTimeout(wait);
  const brand = await page.$(".brand");
  if (brand) await brand.screenshot({ path: `/tmp/logo-${label}.png` });
}
const txt = await page.evaluate(() => document.querySelector(".apar-logo")?.textContent);
console.log("logo text now:", JSON.stringify(txt));
await browser.close();
console.log("done");
