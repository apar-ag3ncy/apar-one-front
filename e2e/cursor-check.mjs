import { chromium } from "playwright";

const URL = process.env.URL || "http://localhost:3000";

const probe = async (page, label, mx, my) => {
  // move in steps so the spring-follow rAF settles toward the pointer
  await page.mouse.move(mx, my, { steps: 8 });
  await page.waitForTimeout(450);
  const res = await page.evaluate(
    ({ mx, my }) => {
      const ring = document.querySelector(".cursor-ring");
      const dot = document.querySelector(".cursor-dot");
      if (!ring) return { exists: false };
      const cs = getComputedStyle(ring);
      const b = ring.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const inViewport =
        b.bottom > 0 && b.right > 0 && b.top < innerHeight && b.left < innerWidth;
      return {
        exists: true,
        ready: ring.classList.contains("ready"),
        opacity: cs.opacity,
        display: cs.display,
        visibility: cs.visibility,
        zIndex: cs.zIndex,
        parent: ring.parentElement?.tagName,
        ringCenter: [Math.round(cx), Math.round(cy)],
        pointerAt: [mx, my],
        offsetFromPointer: [Math.round(cx - mx), Math.round(cy - my)],
        inViewport,
        scrollY: Math.round(window.scrollY),
        dotInViewport: dot
          ? (() => {
              const db = dot.getBoundingClientRect();
              return db.top < innerHeight && db.bottom > 0;
            })()
          : null,
      };
    },
    { mx, my },
  );
  console.log(label.padEnd(26), JSON.stringify(res));
  return res;
};

const run = async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(URL, { waitUntil: "load" });
  // let the intro overlay lift (first visit) + fonts settle
  await page.waitForTimeout(2600);

  const fine = await page.evaluate(() => matchMedia("(pointer: fine)").matches);
  const hasCursorClass = await page.evaluate(() =>
    document.documentElement.classList.contains("has-cursor"),
  );
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("pointer:fine =", fine, "| has-cursor =", hasCursorClass, "| docHeight =", docH);

  const results = {};
  results.hero = await probe(page, "1) hero (scroll 0)", 680, 300);

  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: "instant" }));
  await page.waitForTimeout(300);
  results.s1400 = await probe(page, "2) after hero (scroll 1400)", 700, 350);

  await page.evaluate(() => window.scrollTo({ top: 3200, behavior: "instant" }));
  await page.waitForTimeout(300);
  results.s3200 = await probe(page, "3) mid page (scroll 3200)", 500, 420);

  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
  );
  await page.waitForTimeout(300);
  results.bottom = await probe(page, "4) bottom", 640, 500);

  // Verdict: cursor must track the pointer (small offset) and stay in viewport at every scroll.
  const stages = Object.entries(results);
  const bad = stages.filter(
    ([, r]) => !r.exists || !r.inViewport || Math.abs(r.offsetFromPointer[1]) > 60,
  );
  console.log("\nconsole errors:", errors.length ? errors.slice(0, 5) : "none");
  console.log(
    bad.length === 0
      ? "VERDICT: PASS — cursor tracks the pointer and stays on-screen at every section."
      : "VERDICT: FAIL — cursor lost at: " + bad.map(([k]) => k).join(", "),
  );

  await browser.close();
  process.exit(bad.length === 0 ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
