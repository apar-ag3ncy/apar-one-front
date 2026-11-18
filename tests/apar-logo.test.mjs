import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = ts.transpileModule(fs.readFileSync('components/layout/apar-logo.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Exercise the actual component's font loading, script changes and lifecycle.
// This is deliberately not a substitute for browser layout/visual verification.
function mountLogo({ width = 390, touch = true, responsive = true, reduced = false,
  families = ['fit-vf', 'fit-devanagari-vf'], wordmarkWidth = 79 } = {}) {
  const states = [], refs = [], effects = [], timers = new Map(), observers = new Set(), resizes = new Set();
  const documentListeners = new Map(), fontListeners = new Map(), motionListeners = new Set();
  const requests = [], properties = new Map();
  let now = 0, nextTimer = 1, stateCursor, refCursor, effectCursor, tree;
  const add = (listeners, name, fn) => {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
  };
  const motion = { matches: reduced, addEventListener: (_, fn) => motionListeners.add(fn), removeEventListener: (_, fn) => motionListeners.delete(fn) };
  const fonts = {
    ready: Promise.resolve(),
    load: async (face, glyph) => { requests.push({ face, glyph }); return []; },
    forEach: fn => families.forEach(family => fn({ family: `"${family}"`, status: 'loaded' })),
    addEventListener: (name, fn) => add(fontListeners, name, fn),
    removeEventListener: (name, fn) => fontListeners.get(name)?.delete(fn),
  };
  const document = {
    hidden: false, documentElement: { dataset: {} }, fonts,
    addEventListener: (name, fn) => add(documentListeners, name, fn),
    removeEventListener: (name, fn) => documentListeners.get(name)?.delete(fn),
  };
  const window = { matchMedia: query => query.includes('prefers-reduced-motion') ? motion : { matches: touch || width <= 900 } };
  const hooks = {
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef(initial) { const index = refCursor++; return refs[index] ??= { current: initial }; },
    useEffect(fn, deps) {
      const index = effectCursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        effects[index] = { deps, fn, cleanup: previous?.cleanup, pending: true };
      }
    },
  };
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observers.add(this); }
    observe() {}
    disconnect() { observers.delete(this); }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; resizes.add(this); }
    observe() { this.callback(); }
    disconnect() { resizes.delete(this); }
  }
  class Clock extends Date { static now() { return now; } }
  const setTimeout = (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, at: now + delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'document', 'IntersectionObserver', 'ResizeObserver', 'setTimeout', 'clearTimeout', 'Date', source)(name => {
    if (name === 'react') return hooks;
    if (name === '@/lib/motion-policy') return { useMobileLayout: () => touch || width <= 900, MOBILE_LAYOUT_QUERY: '(max-width: 900px)' };
    return require(name);
  }, module, module.exports, window, document, IntersectionObserver, ResizeObserver, setTimeout, clearTimeout, Clock);
  const container = { style: { setProperty: (key, value) => properties.set(key, value) } };
  const wordmark = { scrollWidth: wordmarkWidth };
  function nodes() {
    const result = [];
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit);
      result.push(node); visit(node.props?.children);
    };
    visit(tree); return result;
  }
  function render() {
    stateCursor = refCursor = effectCursor = 0;
    tree = module.exports.AparLogo({ responsive });
    tree.props.ref.current = container;
    const inner = nodes().find(node => node.props?.className === 'apar-logo-inner');
    if (inner.props.ref) inner.props.ref.current = wordmark;
    for (const effect of effects) if (effect.pending) {
      effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn();
    }
  }
  const flush = async () => { for (let i = 0; i < 8; i++) { await Promise.resolve(); render(); } };
  render();
  return {
    document, requests, properties, flush,
    ready: () => tree.props['data-fonts-ready'] === 'true',
    glyph: () => nodes().find(node => node.props?.className === 'apar-lead-char' && node.props.style.visibility === 'visible')?.props.children,
    glyphs: () => nodes().filter(node => node.props?.className === 'apar-lead-char').map(node => node.props.children),
    intersect(value) { [...observers].forEach(observer => observer.callback([{ isIntersecting: value }])); render(); },
    hide(value) { document.hidden = value; documentListeners.get('visibilitychange')?.forEach(fn => fn()); render(); },
    reduce(value) { motion.matches = value; [...motionListeners].forEach(fn => fn()); render(); },
    resize(value) { wordmark.scrollWidth = value; [...resizes].forEach(observer => observer.callback()); },
    async advance(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
      }
      now = end; await flush();
    },
    unmount() {
      effects.forEach(effect => effect.cleanup?.());
      assert.equal(timers.size, 0, 'no pending timers after unmount');
      assert.equal(observers.size + resizes.size + motionListeners.size, 0);
      assert.ok([...documentListeners.values(), ...fontListeners.values()].every(set => set.size === 0));
    },
  };
}

for (const [width, touch] of [[320, true], [390, true], [768, true], [1024, true], [1440, false]]) {
  for (const responsive of [true, false]) {
    test(`${responsive ? 'header' : 'hero'} cycles genuine Fit glyphs at ${width}px ${touch ? 'touch' : 'desktop'}`, async () => {
      const logo = mountLogo({ width, touch, responsive });
      assert.equal(logo.ready(), false);
      await logo.flush();
      assert.equal(logo.ready(), true);
      assert.equal(logo.glyph(), 'अ');
      assert.ok(logo.requests.every(request => request.face.startsWith('900 64px')));
      logo.intersect(true);
      await logo.advance(800);
      assert.equal(logo.glyph(), 'A');
      await logo.advance(950);
      assert.equal(logo.glyph(), 'А');
      await logo.advance(950);
      assert.equal(logo.glyph(), 'Α');
      await logo.advance(2400);
      assert.equal(logo.glyph(), 'अ');
      logo.unmount();
    });
  }
}

test('logo pauses offscreen and in background tabs, then resumes without duplicate loops', async () => {
  const logo = mountLogo(); await logo.flush();
  await logo.advance(10000); assert.equal(logo.glyph(), 'अ');
  logo.intersect(true); await logo.advance(800); assert.equal(logo.glyph(), 'A');
  logo.intersect(false); await logo.advance(10000); assert.equal(logo.glyph(), 'A');
  logo.intersect(true); logo.hide(true); await logo.advance(10000); assert.equal(logo.glyph(), 'A');
  logo.hide(false); await logo.advance(800); assert.equal(logo.glyph(), 'А');
  logo.unmount();
});

test('reduced motion stays static and preference changes take effect immediately', async () => {
  const logo = mountLogo({ reduced: true }); await logo.flush(); logo.intersect(true);
  await logo.advance(10000); assert.equal(logo.glyph(), 'अ');
  logo.reduce(false); await logo.advance(800); assert.equal(logo.glyph(), 'A');
  logo.reduce(true); await logo.advance(10000); assert.equal(logo.glyph(), 'A');
  logo.unmount();
});

test('font failure preserves the vector fallback and never starts the cycle', async () => {
  const logo = mountLogo({ families: ['fit-vf'] }); await logo.flush(); logo.intersect(true);
  await logo.advance(10000);
  assert.equal(logo.ready(), false); assert.equal(logo.glyph(), 'अ');
  logo.unmount();
});

test('optional scripts enter only with their genuine Fit family and wide glyphs fit the fixed header', async () => {
  const logo = mountLogo({ families: ['fit-vf', 'fit-devanagari-vf', 'fit-hebrew-vf'], wordmarkWidth: 100 });
  await logo.flush();
  assert.deepEqual(logo.glyphs(), ['अ', 'A', 'А', 'Α', 'א']);
  assert.equal(logo.properties.get('--apar-logo-scale'), '0.8');
  logo.resize(79); assert.equal(logo.properties.get('--apar-logo-scale'), '1');
  logo.unmount();
});

test('script changes wait for the hero entrance to finish', async () => {
  const logo = mountLogo(); await logo.flush();
  logo.document.documentElement.dataset.heroEntrance = '1'; logo.intersect(true);
  await logo.advance(3000); assert.equal(logo.glyph(), 'अ');
  delete logo.document.documentElement.dataset.heroEntrance;
  await logo.advance(1050); assert.equal(logo.glyph(), 'A');
  logo.unmount();
});
