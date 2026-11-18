import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';
import { loadTypeScript } from './load-typescript.mjs';

const { diamondScale } = loadTypeScript('components/home/diamond/mobile-framing.js');
const { diamondTriangles, createFragmentGeometry } = loadTypeScript('components/home/diamond/geometry.js');
const { diamondMaterial } = loadTypeScript('components/home/diamond/fragment-material.js');

// Project the actual shader-driven shards, including their rotation and depth,
// through the production camera. A generic bounding box misses outward motion.
for (const [width, height] of [[320, 480], [360, 552], [393, 582], [430, 582], [768, 582]]) {
  test(`diamond and every burst fragment fit a ${width}x${height} touch canvas`, () => {
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(36, aspect, .1, 50);
    const radius = Math.hypot(1.1, 10.4), yaw = -.12, elevation = .105;
    camera.position.set(-Math.sin(yaw) * radius * Math.cos(elevation), -.1 + Math.sin(elevation) * radius,
      Math.cos(yaw) * radius * Math.cos(elevation));
    camera.lookAt(0, -.1, 0); camera.updateMatrixWorld();
    const geometry = createFragmentGeometry(diamondTriangles()), a = geometry.attributes;
    const p = new THREE.Vector3(), centre = new THREE.Vector3(), axis = new THREE.Vector3(), travel = new THREE.Vector3();
    for (let step = 0; step <= 40; step++) {
      const burst = step / 40;
      let left = Infinity, right = -Infinity;
      for (let i = 0; i < a.position.count; i++) {
        centre.fromBufferAttribute(a.aCentre, i); axis.fromBufferAttribute(a.aAxis, i);
        travel.fromBufferAttribute(a.aBurst, i);
        p.fromBufferAttribute(a.position, i).sub(centre).applyAxisAngle(axis, burst * a.aSpin.getX(i))
          .multiplyScalar(1 - burst * .64).add(centre).addScaledVector(travel, burst)
          .multiplyScalar(diamondScale(true, aspect, burst)).applyAxisAngle(new THREE.Vector3(0, 1, 0), .12);
        p.y += .17; p.project(camera);
        assert.ok(Math.abs(p.x) <= .93 && Math.abs(p.y) <= .93, `clipped shard at burst ${burst}: ${p.toArray()}`);
        left = Math.min(left, p.x); right = Math.max(right, p.x);
      }
      if (!step && width < 500) assert.ok((right - left) / 2 > .5, 'assembled jewel occupies at least half the phone width');
    }
    geometry.dispose();
  });
}

test('desktop sculpture scale and crystal shader retain their original quality', () => {
  for (const burst of [0, .1, .5, 1]) assert.equal(diamondScale(false, 1.6, burst), 1.3);
  const desktop = diamondMaterial(), mobile = diamondMaterial(null, true);
  assert.match(desktop.fragmentShader, /bounce < 3/);
  assert.match(mobile.fragmentShader, /bounce < 1/);
  desktop.dispose(); mobile.dispose();
});

const require = createRequire(import.meta.url);
const componentSource = ts.transpileModule(fs.readFileSync('components/home/diamond/index.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Real component lifecycle and event handlers; layout and GPU output are verified
// separately in the browser. No dependency on private React or browser internals.
function mountDiamond({ reduced = false, failScene = false } = {}) {
  const states = [], refs = [], effects = [], observers = new Set(), timers = new Map(), tweens = [], sceneCalls = [];
  let stateCursor, refCursor, effectCursor, tree, nextTimer = 1, disposed = 0;
  const hooks = {
    useState(initial) { const i = stateCursor++; if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(initial) { return refs[refCursor++] ??= { current: initial }; },
    useEffect(fn, deps) { const i = effectCursor++, old = effects[i];
      if (!old || deps.some((value, j) => value !== old.deps[j])) effects[i] = { fn, deps, cleanup: old?.cleanup, pending: true }; },
  };
  const motionQuery = () => ({ matches: reduced });
  const window = { setTimeout: fn => { const id = nextTimer++; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) };
  class IntersectionObserver {
    constructor(fn) { this.fn = fn; observers.add(this); }
    observe() {}
    disconnect() { observers.delete(this); }
  }
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'matchMedia', 'IntersectionObserver', componentSource)(name => {
    if (name === 'react') return hooks;
    if (name === '@/lib/motion-policy') return { useMobileLayout: () => true };
    if (name === 'gsap/ScrollTrigger') return {};
    if (name === 'gsap') return { gsap: {
      killTweensOf() {},
      to(state, options) { tweens.push(options); state.burst = options.burst; state.progress = options.progress; options.onUpdate(); },
    } };
    if (name === '@/components/home/diamond/create-scene') return { createDiamondScene(...args) {
      sceneCalls.push(args); if (failScene) throw new Error('WebGL unavailable');
      args[4](); args[2](); return { render() {}, dispose() { disposed++; } };
    } };
    if (name.startsWith('@/') || name === 'next/link') return new Proxy({}, { get: (_, key) => key });
    return require(name);
  }, module, module.exports, window, motionQuery, IntersectionObserver);
  const elements = new Map();
  function nodes() {
    const result = [];
    const visit = node => { if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit); result.push(node); visit(node.props?.children); };
    visit(tree); return result;
  }
  function render() {
    stateCursor = refCursor = effectCursor = 0; tree = module.exports.MJShowcase();
    for (const node of nodes()) if (node.props?.ref) {
      const key = node.props.className;
      if (!elements.has(key)) elements.set(key, { dataset: {}, style: { setProperty() {} } });
      node.props.ref.current = elements.get(key);
    }
    for (const effect of effects) if (effect.pending) { effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn(); }
  }
  const flush = async () => { for (let i = 0; i < 8; i++) { await Promise.resolve(); render(); } };
  render();
  return {
    sceneCalls, tweens, timers, flush,
    renderer: () => nodes().find(node => node.props?.id === 'diamond-experience').props['data-renderer'],
    burst: () => elements.get('mj-scroll-track').dataset.burst,
    near() { [...observers].forEach(observer => observer.fn([{ isIntersecting: true }])); render(); },
    tap(className = 'mj-touch-surface') { nodes().find(node => node.props?.className?.split(' ').includes(className)).props.onClick(); render(); },
    pressed: () => nodes().find(node => node.props?.className === 'mj-touch-surface').props['aria-pressed'],
    unmount() { effects.forEach(effect => effect.cleanup?.()); assert.equal(timers.size + observers.size, 0); return disposed; },
  };
}

test('phone lazily loads 3D, and both sculpture and button break/reassemble it', async () => {
  const app = mountDiamond(); await app.flush();
  assert.equal(app.sceneCalls.length, 0); assert.equal(app.burst(), '0.000');
  app.near(); await app.flush();
  assert.equal(app.sceneCalls.length, 1); assert.equal(app.sceneCalls[0][5], true);
  assert.equal(app.renderer(), 'webgl');
  app.tap(); await app.flush(); assert.equal(app.burst(), '1.000'); assert.equal(app.pressed(), true);
  app.tap('mj-manual'); await app.flush(); assert.equal(app.burst(), '0.000'); assert.equal(app.pressed(), false);
  assert.equal(app.unmount(), 1);
});

test('phone tap works before intersection loading and reduced motion skips tween duration', async () => {
  const app = mountDiamond({ reduced: true }); app.tap(); await app.flush();
  assert.equal(app.sceneCalls.length, 1); assert.equal(app.burst(), '1.000');
  assert.equal(app.tweens[0].duration, 0);
  app.near(); await app.flush(); assert.equal(app.renderer(), 'webgl', 'late intersection does not hide a ready scene');
  app.unmount();
});

test('WebGL failure retains a usable break/reassemble fallback on phones', async () => {
  const app = mountDiamond({ failScene: true }); app.near(); await app.flush();
  assert.equal(app.renderer(), 'fallback'); assert.equal(app.timers.size, 0);
  app.tap(); await app.flush(); assert.equal(app.burst(), '1.000');
  app.tap(); await app.flush(); assert.equal(app.burst(), '0.000'); app.unmount();
});
