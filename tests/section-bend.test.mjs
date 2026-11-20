import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { loadTypeScript } from "./load-typescript.mjs";

const { createSectionBend, sectionBendPath } = loadTypeScript("lib/motion/section-bend.ts");
const { mountSectionEdgeMotion } = loadTypeScript("components/home/section-edge-motion.ts");

test("section joins follow both scroll directions, remain bounded, and settle exactly flat", () => {
  const motion = createSectionBend(0, 0);
  assert.deepEqual(motion.tick(16), { bend: 0, moving: false });
  let result;
  for (let t = 32; t <= 320; t += 16) {
    motion.sample(t * 100, t);
    result = motion.tick(t);
    assert.ok(result.bend > 0 && result.bend <= 14);
  }
  for (let t = 336; t <= 640; t += 16) {
    motion.sample(32000 - (t - 320) * 100, t);
    result = motion.tick(t);
    assert.ok(Math.abs(result.bend) <= 14);
  }
  assert.ok(result.bend < 0);
  for (let t = 656; t <= 2000; t += 16) result = motion.tick(t);
  assert.deepEqual(result, { bend: 0, moving: false });
  motion.sample(200000, 2016);
  assert.ok(motion.tick(2016).bend > 0);
  motion.reset(200000, 2032);
  assert.deepEqual(motion.tick(2048), { bend: 0, moving: false });
});

test("the edge paints only a single shallow arc with fixed ends at every desktop width", async () => {
  for (const width of [901, 1440, 2880]) for (const bend of [-14, 0, 14]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40" viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="${sectionBendPath(bend)}" /></svg>`;
    const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const occupied = x => Array.from({ length: 40 }, (_, y) => y)
      .filter(y => data[(y * width + x) * info.channels + 3] > 128);
    assert.deepEqual(occupied(0), []);
    assert.deepEqual(occupied(width - 1), []);
    const centre = occupied(Math.floor(width / 2));
    assert.equal(centre.length, Math.abs(bend));
    if (bend > 0) assert.ok(centre.every(y => y >= 20 && y < 34));
    if (bend < 0) assert.ok(centre.every(y => y >= 6 && y < 20));
    assert.ok(occupied(Math.floor(width / 4)).length <= centre.length);
  }
});

function browserHarness(t, enabled = true) {
  let now = 0, nextFrame = 0, observer;
  const frames = new Map();
  const media = Object.assign(new EventTarget(), { matches: enabled });
  const win = Object.assign(new EventTarget(), { scrollY: 0, matchMedia: () => media });
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const path = { style: {}, d: sectionBendPath(0), setAttribute(name, value) { this[name] = value; } };
  const edge = { querySelector: () => path };
  class Observer {
    observed = new Set();
    constructor(callback) { this.callback = callback; observer = this; }
    observe(element) { this.observed.add(element); }
    disconnect() { this.observed.clear(); }
    visible(value) { this.callback([{ target: edge, isIntersecting: value }]); }
  }
  win.IntersectionObserver = Observer;
  const globals = {
    window: win, document: doc, IntersectionObserver: Observer,
    performance: { now: () => now },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const descriptors = new Map();
  for (const [key, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    descriptors.set(key, descriptor);
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  const cleanup = mountSectionEdgeMotion({ querySelectorAll: () => [edge] });
  t.after(() => {
    cleanup();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return {
    win, doc, media, path, observer, frames, cleanup,
    scroll(delta) { win.scrollY += delta; win.dispatchEvent(new Event("scroll")); },
    step() { now += 16; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); },
  };
}

test("edge rendering parks at rest, switches fill on reverse scrolling, and stops offscreen", t => {
  const h = browserHarness(t);
  h.observer.visible(true);
  h.step();
  assert.equal(h.frames.size, 0);
  for (let i = 0; i < 12; i++) { h.scroll(120); h.step(); }
  assert.notEqual(h.path.d, sectionBendPath(0));
  assert.equal(h.path.style.fill, "var(--edge-above)");
  for (let i = 0; i < 20; i++) { h.scroll(-120); h.step(); }
  assert.equal(h.path.style.fill, "var(--edge-below)");
  for (let i = 0; i < 100; i++) h.step();
  assert.equal(h.path.d, sectionBendPath(0));
  assert.equal(h.frames.size, 0);
  h.scroll(120); h.step();
  h.observer.visible(false);
  assert.equal(h.path.d, sectionBendPath(0));
  h.scroll(120);
  assert.equal(h.frames.size, 0);
});

test("resize, hidden tabs, motion preferences and unmount immediately restore straight borders", t => {
  const h = browserHarness(t);
  h.observer.visible(true); h.step();
  const move = () => { h.scroll(120); h.step(); assert.notEqual(h.path.d, sectionBendPath(0)); };
  const flat = () => { assert.equal(h.path.d, sectionBendPath(0)); assert.equal(h.frames.size, 0); };
  move(); h.win.dispatchEvent(new Event("resize")); flat();
  move(); h.doc.hidden = true; h.doc.dispatchEvent(new Event("visibilitychange")); flat();
  h.scroll(120); flat();
  h.doc.hidden = false; h.doc.dispatchEvent(new Event("visibilitychange"));
  move(); h.media.matches = false; h.media.dispatchEvent(new Event("change")); flat();
  assert.equal(h.observer.observed.size, 0);
  h.scroll(120); flat();
  h.media.matches = true; h.media.dispatchEvent(new Event("change"));
  h.observer.visible(true); h.step();
  move(); h.cleanup(); flat();
  h.scroll(120); h.media.dispatchEvent(new Event("change")); flat();
  assert.equal(h.observer.observed.size, 0);
});

test("phone and reduced-motion policy allocates no edge animation", t => {
  const h = browserHarness(t, false);
  assert.equal(h.observer.observed.size, 0);
  h.scroll(200); h.step();
  assert.equal(h.frames.size, 0);
  assert.equal(h.path.d, sectionBendPath(0));
});
