import { chromium } from "playwright";

const base = process.env.BASE || "http://localhost:3009";
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.setDefaultTimeout(120000);
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(4000);

const el = await page.$(".brand-band");
// bring it into view to trigger the focus-in reveal, grab an early (blurred) frame
await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
await page.waitForTimeout(380);
await el.screenshot({ path: "/tmp/logoreveal-mid.png" });
console.log("shot mid");

// final, settled (sharp) frame
await page.waitForTimeout(2200);
await page.mouse.move(5, 5, { steps: 2 });
await page.waitForTimeout(500);
await el.screenshot({ path: "/tmp/logoreveal-final.png" });
console.log("shot final");

await browser.close();
console.log("done");
