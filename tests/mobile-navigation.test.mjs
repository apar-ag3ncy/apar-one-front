import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = ts.transpileModule(fs.readFileSync('components/layout/nav.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Exercise the actual Nav handlers/effects without browser access. Geometry and
// rendering still need a visual check in the permitted local browser.
function mountNav() {
  const states = [], refs = [], effects = [], listeners = new Map();
  let stateCursor, refCursor, effectCursor, tree, pathname = '/work', resize;
  const document = { documentElement: { style: { overflow: '' } }, body: { style: { overflow: '' } }, activeElement: null };
  const compact = { matches: true, addEventListener: (_, fn) => { resize = fn; }, removeEventListener: () => { resize = null; } };
  const lenis = { stopped: false, stop() { this.stopped = true; }, start() { this.stopped = false; } };
  const window = {
    scrollY: 0,
    matchMedia: () => compact,
    addEventListener: (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener: (name, fn) => listeners.get(name)?.delete(fn),
  };
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
  const module = { exports: {} };
  const localRequire = name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime' || name === 'clsx') return require(name);
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/navigation') return { usePathname: () => pathname };
    if (name === '@/lib/scroll-state') return { getLenis: () => lenis };
    return new Proxy({}, { get: () => () => null });
  };
  new Function('require', 'module', 'exports', 'window', 'document', source)(localRequire, module, module.exports, window, document);
  const focusable = new Map();
  const element = key => {
    if (!focusable.has(key)) focusable.set(key, { key, focus: () => { document.activeElement = focusable.get(key); } });
    return focusable.get(key);
  };
  const all = () => {
    const nodes = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit);
      nodes.push(node); visit(node.props?.children);
    }
    visit(tree); return nodes;
  };
  const find = className => all().find(node => node.props?.className?.split(' ').includes(className));
  function render() {
    stateCursor = refCursor = effectCursor = 0;
    tree = module.exports.Nav();
    const menu = find('mobile-menu');
    const controls = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit);
      if (node.type === 'a' || node.type === 'button') controls.push(element(node.props.href ?? node.props.className));
      visit(node.props?.children);
    }
    visit(menu);
    find('nav-burger').props.ref.current = element('toggle');
    menu.props.ref.current = { contains: target => controls.includes(target), querySelectorAll: () => controls };
    element('toggle').contains = target => target === element('toggle');
    for (const effect of effects) if (effect.pending) {
      effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn();
    }
  }
  render();
  return {
    document, compact, lenis, find, element, render,
    open() { find('nav-burger').props.onClick(); render(); },
    event(name, event) { listeners.get(name)?.forEach(fn => fn(event)); render(); },
    resizeDesktop() { compact.matches = false; resize(); render(); },
    navigate(path) { pathname = path; render(); render(); },
    scroll(y) { window.scrollY = y; listeners.get('scroll')?.forEach(fn => fn()); render(); },
    unmount() { effects.forEach(effect => effect.cleanup?.()); assert.ok([...listeners.values()].every(set => set.size === 0)); },
  };
}

test('navigation preserves route, scroll and open-menu styling together', () => {
  const nav = mountNav();
  assert.equal(nav.find('nav').props.className, 'nav');
  assert.equal(nav.find('mobile-menu').props.className, 'mobile-menu');
  assert.equal(nav.find('mobile-menu-backdrop').props.className, 'mobile-menu-backdrop');

  nav.navigate('/');
  nav.scroll(25);
  nav.open();
  assert.equal(nav.find('nav').props.className, 'nav on-dark scrolled menu-open');
  assert.equal(nav.find('mobile-menu').props.className, 'mobile-menu open');
  assert.equal(nav.find('mobile-menu-backdrop').props.className, 'mobile-menu-backdrop open');

  nav.navigate('/work/chheda');
  assert.equal(nav.find('nav').props.className, 'nav on-case scrolled');
  assert.equal(nav.find('mobile-menu').props.className, 'mobile-menu');
  assert.equal(nav.find('mobile-menu-backdrop').props.className, 'mobile-menu-backdrop');
  nav.open();
  assert.equal(nav.find('nav').props.className, 'nav on-case scrolled menu-open');
  nav.scroll(0);
  assert.equal(nav.find('nav').props.className, 'nav on-case menu-open');
  nav.navigate('/manifesto');
  assert.equal(nav.find('nav').props.className, 'nav');
  nav.unmount();
});

test('compact menu retains every destination and restores focus when dismissed', () => {
  const nav = mountNav();
  assert.equal(nav.find('mobile-menu').props.inert, true);
  nav.open();
  assert.equal(nav.find('nav-burger').props['aria-expanded'], true);
  assert.equal(nav.find('mobile-menu').props.inert, false);
  assert.equal(nav.document.activeElement.key, '/');
  assert.equal(nav.document.documentElement.style.overflow, 'hidden');
  assert.equal(nav.lenis.stopped, true);
  const controls = nav.find('mobile-menu').props.ref.current.querySelectorAll();
  assert.deepEqual(controls.map(control => control.key), ['/', '/work', '/#contact', '/what-we-do', '/clients', '/manifesto', '/#studio', '/start', 'mm-close']);
  nav.event('pointerdown', { target: controls[0] });
  assert.equal(nav.find('nav-burger').props['aria-expanded'], true, 'inside taps do not dismiss prematurely');
  nav.event('pointerdown', { target: {} });
  assert.equal(nav.find('nav-burger').props['aria-expanded'], false);
  assert.equal(nav.document.activeElement.key, 'toggle');
  assert.equal(nav.document.documentElement.style.overflow, '');
  assert.equal(nav.lenis.stopped, false);
  nav.unmount();
});

test('keyboard focus includes the bottom close control and Escape returns to the pill', () => {
  const nav = mountNav(); nav.open();
  nav.element('mm-close').focus();
  let prevented = false;
  nav.event('keydown', { key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
  assert.ok(prevented); assert.equal(nav.document.activeElement.key, 'toggle');
  nav.event('keydown', { key: 'Tab', shiftKey: true, preventDefault() {} });
  assert.equal(nav.document.activeElement.key, 'mm-close');
  nav.event('keydown', { key: 'Escape' });
  assert.equal(nav.find('mobile-menu').props.inert, true);
  assert.equal(nav.document.activeElement.key, 'toggle');
  nav.open(); nav.find('mm-close').props.onClick(); nav.render();
  assert.equal(nav.find('mobile-menu').props.inert, true);
  assert.equal(nav.document.activeElement.key, 'toggle');
  nav.unmount();
});

test('links, route changes and a desktop resize release the menu scroll lock', () => {
  const nav = mountNav(); nav.open();
  nav.find('mobile-menu').props.onClick({ target: { closest: () => ({}) } }); nav.render();
  assert.equal(nav.find('mobile-menu').props.inert, true);
  assert.equal(nav.document.body.style.overflow, '');
  nav.open(); nav.navigate('/clients');
  assert.equal(nav.find('mobile-menu').props.inert, true);
  nav.open(); nav.resizeDesktop();
  assert.equal(nav.find('mobile-menu').props.inert, true);
  assert.equal(nav.document.documentElement.style.overflow, '');
  assert.equal(nav.lenis.stopped, false);
  nav.unmount();
});
