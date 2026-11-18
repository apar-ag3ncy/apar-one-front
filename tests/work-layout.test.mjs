import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(fs.readFileSync("components/work/work-index.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;

// Exercise the real resize lifecycle against supplied element measurements.
// This verifies the layout algorithm, not a browser's visual rendering.
test("work cards use natural phone flow, pack on desktop and clear spans when resized back", () => {
  const frames = new Map(), listeners = new Map(), effects = [];
  let frameId = 0, observer, gap = 32, display = "flex";
  const cards = [150, 300].map(height => ({
    offsetHeight: height,
    style: { gridRowEnd: "", removeProperty() { this.gridRowEnd = ""; } },
  }));
  const grid = { dataset: {}, querySelectorAll: selector => selector === ".work-card" ? cards : [] };
  const hooks = {
    useState: initial => [initial, () => {}],
    useRef: () => ({ current: grid }),
    useEffect: effect => effects.push(effect),
  };
  const globals = {
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
    },
    ResizeObserver: class {
      observed = new Set();
      constructor(fn) { observer = this; this.notify = fn; }
      observe(card) { this.observed.add(card); }
      disconnect() { this.observed.clear(); }
    },
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    getComputedStyle: () => ({ display, getPropertyValue: () => String(gap) }),
  };
  const module = { exports: {} };
  const localRequire = name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    // Visual children are not mounted by this effect-only harness.
    return new Proxy({}, { get: () => () => null });
  };
  new Function("require", "module", "exports", ...Object.keys(globals), source)(localRequire, module, module.exports, ...Object.values(globals));
  module.exports.WorkIndex({ clients: [] });
  const cleanup = effects[0]();
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  flush();
  assert.equal(grid.dataset.masonry, undefined);
  assert.ok(cards.every(card => card.style.gridRowEnd === ""));
  assert.equal(observer.observed.size, 2);

  display = "grid";
  cards[0].offsetHeight = 420;
  cards[1].offsetHeight = 580;
  listeners.get("resize")();
  flush();
  assert.equal(grid.dataset.masonry, "true");
  assert.deepEqual(cards.map(card => card.style.gridRowEnd), ["span 452", "span 612"]);

  gap = 24;
  cards[0].offsetHeight = 190;
  cards[1].offsetHeight = 310;
  observer.notify();
  observer.notify();
  assert.equal(frames.size, 1, "coalesce font/image/size notifications into one measurement");
  flush();
  assert.deepEqual(cards.map(card => card.style.gridRowEnd), ["span 214", "span 334"]);
  display = "flex";
  listeners.get("resize")();
  flush();
  assert.equal(grid.dataset.masonry, undefined);
  assert.ok(cards.every(card => card.style.gridRowEnd === ""));
  observer.notify();
  cleanup();
  assert.equal(frames.size, 0);
  assert.equal(observer.observed.size, 0);
  assert.equal(listeners.size, 0);
  assert.equal(grid.dataset.masonry, undefined);
  assert.ok(cards.every(card => card.style.gridRowEnd === ""));
});
