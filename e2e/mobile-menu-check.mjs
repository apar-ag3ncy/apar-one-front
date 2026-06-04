import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:3000";

const state = (page) =>
  page.evaluate(() => {
    const burger = document.querySelector(".nav-burger");
    const menu = document.querySelector(".mobile-menu");
    const mc = menu && getComputedStyle(menu);
    const mb = menu && menu.getBoundingClientRect();
    let burgerHittable = null;
    if (burger) {
      const r = burger.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      burgerHittable = !!(el && el.closest && el.closest(".nav-burger"));
    }
    let linkHittable = null;
    const a = document.querySelector(".mm-links a");
    if (a) {
      const r = a.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      linkHittable = !!(el && el.closest && el.closest(".mm-links"));
    }
    return {
      burgerDisplay: burger ? getComputedStyle(burger).display : null,
      burgerHittable,
      menuOpen: menu?.classList.contains("open") ?? null,
      menuTop: mb ? Math.round(mb.top) : null,
      menuZ: mc?.zIndex,
      linkHittable,
    };
  });

async function scenario(page, label, { scrollTo = 0 } = {}) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scrollTo);
  await page.waitForTimeout(300);

  const before = await state(page);
  await page.locator(".nav-burger").tap();
  await page.waitForTimeout(750);
  const opened = await state(page);

  // tap the burger again -> should close (the X), no navigation
  await page.locator(".nav-burger").tap();
  await page.waitForTimeout(750);
  const toggledClosed = (await state(page)).menuOpen === false;

  // reopen, then tap "Clients" in the menu
  await page.locator(".nav-burger").tap();
  await page.waitForTimeout(700);
  let navOk = false;
  try {
    await page.locator(".mobile-menu .mm-links a", { hasText: "Clients" }).tap({ timeout: 3000 });
    await page.waitForURL("**/clients", { timeout: 4000 });
    navOk = true;
  } catch {
    navOk = false;
  }
  await page.waitForTimeout(500);
  const closed = page.evaluate(
    () => document.querySelector(".mobile-menu")?.classList.contains("open") ?? null,
  );
  const menuOpenAfter = await closed;

  const pass =
    before.burgerDisplay === "flex" &&
    opened.burgerHittable &&
    opened.menuOpen === true &&
    opened.menuTop === 0 &&
    opened.linkHittable &&
    toggledClosed &&
    navOk &&
    menuOpenAfter === false;

  console.log(
    `${label.padEnd(22)} burger=${before.burgerDisplay} open=${opened.menuOpen} top=${opened.menuTop} burgerCloses=${toggledClosed} link=${opened.linkHittable} nav=${navOk} closedAfterNav=${menuOpenAfter === false}  -> ${pass ? "PASS" : "FAIL"}`,
  );
  return pass;
}

const run = async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const errors = [];
  let all = true;

  // 1) home, at top
  let page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  all = (await scenario(page, "home (top)")) && all;

  // 2) home, scrolled (nav in .scrolled state)
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  all = (await scenario(page, "home (scrolled)", { scrollTo: 1600 })) && all;

  // 3) a subpage (/work)
  await page.goto(URL + "/work", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  all = (await scenario(page, "/work (scrolled)", { scrollTo: 900 })) && all;

  console.log("\nconsole errors:", errors.length ? [...new Set(errors)].slice(0, 5) : "none");
  console.log(all ? "VERDICT: PASS — mobile menu works everywhere." : "VERDICT: FAIL");
  await browser.close();
  process.exit(all ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
