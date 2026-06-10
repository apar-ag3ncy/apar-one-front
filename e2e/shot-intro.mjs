import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
// fresh context = empty sessionStorage = intro plays
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 800 },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.goto("http://localhost:3001/", { waitUntil: "domcontentloaded" });

await page.waitForTimeout(700);
console.log("#intro present:", await page.evaluate(() => !!document.querySelector("#intro")));
await page.screenshot({ path: "/tmp/intro-1.png" });
const t1 = await page.evaluate(() => document.querySelector("#intro .apar-logo")?.textContent);
await page.waitForTimeout(450);
await page.screenshot({ path: "/tmp/intro-2.png" });
const t2 = await page.evaluate(() => document.querySelector("#intro .apar-logo")?.textContent);

console.log("intro logo frames:", JSON.stringify(t1), JSON.stringify(t2));
await browser.close();
console.log("done");
