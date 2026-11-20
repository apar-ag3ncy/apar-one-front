import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const liquid = loadTypeScript('lib/motion/text-liquid.ts');
const { mountLiquidTextScroll } = loadTypeScript('components/motion/mount-liquid-text-scroll.ts');

test('text uses longer entry and exit ranges with a clear central reading zone in both directions', () => {
  const amount = liquid.textLiquidAmount;
  assert.equal(amount(1170, 1230, 1000), 1);
  assert.ok(amount(970, 1030, 1000) > amount(900, 960, 1000));
  assert.ok(amount(800, 860, 1000) > 0);
  assert.equal(amount(680, 740, 1000), 0);
  for (const top of [680, 600, 520]) assert.equal(amount(top, top + 60, 1000), 0);
  // The exit is already visible at mid-screen, well before the old 36% mark.
  assert.ok(amount(460, 520, 1000) > 0.2);
  assert.ok(amount(460, 520, 1000) < amount(200, 260, 1000));
  assert.ok(amount(200, 260, 1000) > 0);
  assert.equal(amount(0, 60, 1000), 1);
  // A long paragraph is still readable even after its first lines pass the nav.
  assert.equal(amount(-100, 600, 1000), 0);
  assert.equal(amount(100, 150, 0), 0);
  const positions = [1100, 1000, 900, 800, 500, 300, 100, 0, -100];
  const forward = positions.map(top => amount(top, top + 60, 1000));
  assert.deepEqual(positions.toReversed().map(top => amount(top, top + 60, 1000)), forward.toReversed());
});

test('hero is crisp at rest and starts melting immediately with scroll, including scroll-up reversal', () => {
  const amount = top => liquid.textLiquidAmount(600, 680, 1000, top);
  assert.equal(amount(0), 0);
  assert.ok(amount(-30) > 0.08);
  assert.ok(amount(-120) > amount(-30));
  assert.ok(amount(-500) < 1);
  assert.equal(amount(-700), 1);
  assert.equal(amount(30), 0);
});

class ElementMock extends EventTarget {
  constructor() { super(); this.attrs = {}; this.children = []; this.style = { filter: '' }; this.box = {top:920,bottom:970,left:0,right:400,width:400,height:50}; }
  setAttribute(key, value) { this.attrs[key] = value; }
  append(...items) { for (const item of items) { item.parent = this; this.children.push(item); } }
  remove() { this.parent.children = this.parent.children.filter(item => item !== this); }
  getBoundingClientRect() { return this.box; }
  matches(selector) { return !!this.focused || (selector.includes(':hover') && !!this.hovered); }
  closest(selector) { return selector === '.hero-beam' ? this.hero ?? null : null; }
}

function harness(t, enabled = true, phone = false) {
  let frameID = 0, observer, mutation;
  let now = 0;
  const frames = new Map();
  const root = new ElementMock(), defs = new ElementMock();
  const original = new ElementMock();
  original.style.filter = 'contrast(1)';
  let copy = [original];
  const motion = Object.assign(new EventTarget(), {matches:enabled});
  const compact = Object.assign(new EventTarget(), {matches:phone});
  const win = Object.assign(new EventTarget(), {innerWidth:1440, scrollY:2000, matchMedia:q => q.includes('no-preference') ? motion : compact});
  const doc = Object.assign(new EventTarget(), {
    hidden:false, documentElement:{clientHeight:1000}, fonts:new EventTarget(),
    createElementNS:() => new ElementMock(),
  });
  class Observer {
    observed = new Set();
    constructor(callback) { this.callback = callback; observer = this; }
    observe(el) { this.observed.add(el); }
    unobserve(el) { this.observed.delete(el); }
    disconnect() { this.observed.clear(); }
    visible(el, isIntersecting = true) { this.callback([{target:el, isIntersecting}]); }
  }
  class Mutations {
    constructor(callback) { this.callback = callback; mutation = this; }
    observe() { this.connected = true; }
    disconnect() { this.connected = false; }
    change() { if (this.connected) this.callback([{target:root}]); }
  }
  win.IntersectionObserver = Observer;
  const globals = {window:win, document:doc, Element:ElementMock, IntersectionObserver:Observer, MutationObserver:Mutations,
    performance:{now:()=>now},
    getComputedStyle:el => ({fontSize:el.size ?? '48px'}),
    requestAnimationFrame:fn => { frames.set(++frameID,fn); return frameID; },
    cancelAnimationFrame:id => frames.delete(id),
  };
  const saved = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis,key)]));
  for (const [key,value] of Object.entries(globals)) Object.defineProperty(globalThis,key,{value,configurable:true});
  const collect = liquid.collectLiquidText;
  liquid.collectLiquidText = () => copy;
  const cleanup = mountLiquidTextScroll(root,defs);
  t.after(() => {
    cleanup(); liquid.collectLiquidText = collect;
    for (const [key,descriptor] of saved) if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];
  });
  return {root,defs,original,win,doc,motion,observer,mutation,frames,cleanup,
    setCopy(value) {copy=value; mutation.change();},
    step() {now+=100; const callbacks=[...frames.values()]; frames.clear(); callbacks.forEach(fn=>fn());},
    scroll(delta=40) {win.scrollY+=delta; win.dispatchEvent(new Event('scroll'));},
  };
}

test('visible text filters park at rest, restore in the reading zone and retrace on reverse scroll', t => {
  const h = harness(t);
  h.observer.visible(h.original); h.step();
  assert.match(h.original.style.filter,/url\("#site-liquid-/);
  const values = () => h.defs.children[0].children.map(child=>({...child.attrs}));
  const first = values();
  assert.equal(h.frames.size,0);
  h.original.box = {...h.original.box,top:600,bottom:650}; h.scroll(); h.step();
  assert.equal(h.original.style.filter,'contrast(1)');
  h.original.box = {...h.original.box,top:920,bottom:970}; h.scroll(); h.step();
  assert.deepEqual(values(),first);
  assert.equal(h.defs.children.length,1);
  h.original.focused=true; h.root.dispatchEvent(new Event('focusin')); h.step();
  assert.equal(h.original.style.filter,'contrast(1)');
  h.original.focused=false; h.root.dispatchEvent(new Event('focusout')); h.step();
  assert.match(h.original.style.filter,/url/);
  h.observer.visible(h.original,false); h.step();
  assert.equal(h.original.style.filter,'contrast(1)');
});

test('route changes, resize, hidden tabs and reduced-motion changes clean up live filters', t => {
  const h = harness(t);
  h.observer.visible(h.original); h.step();
  const next = new ElementMock();
  h.setCopy([next]); h.step();
  assert.equal(h.original.style.filter,'contrast(1)');
  assert.equal(h.observer.observed.has(h.original),false);
  assert.ok(h.observer.observed.has(next));
  h.observer.visible(next); h.step();
  const scale = () => Number(h.defs.children[0].children[4].attrs.scale);
  const before=scale(); next.size='72px'; h.win.dispatchEvent(new Event('resize')); h.step();
  assert.ok(scale()>before);
  h.doc.hidden=true; h.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(next.style.filter,''); assert.equal(h.frames.size,0);
  h.doc.hidden=false; h.doc.dispatchEvent(new Event('visibilitychange')); h.step();
  assert.match(next.style.filter,/url/);
  h.motion.matches=false; h.motion.dispatchEvent(new Event('change'));
  assert.equal(next.style.filter,''); assert.equal(h.defs.children.length,0);
  assert.equal(h.observer.observed.size,0);
  h.motion.matches=true; h.motion.dispatchEvent(new Event('change'));
  h.observer.visible(next); h.step(); assert.match(next.style.filter,/url/);
  h.cleanup(); h.scroll(); h.mutation.change();
  assert.equal(next.style.filter,''); assert.equal(h.frames.size,0); assert.equal(h.defs.children.length,0);
});

test('reduced motion allocates no filters or observers', t => {
  const h=harness(t,false);
  h.scroll(); h.step();
  assert.equal(h.observer.observed.size,0); assert.equal(h.defs.children.length,0);
  assert.equal(h.original.style.filter,'contrast(1)');
});

test('phones receive the liquid effect with gentler displacement', t => {
  const h=harness(t,true,true);
  h.observer.visible(h.original); h.step();
  assert.match(h.original.style.filter,/url/);
  const scale=Number(h.defs.children[0].children[4].attrs.scale);
  const full=liquid.textLiquidAmount(920,970,1000)*48*.5;
  assert.ok(scale>0 && scale<full*.7);
});

test('scrolling upward re-arms a blurred entrance, resolves fully, and repeats after leaving the screen', t => {
  const h=harness(t);
  const enterFromTop = () => {
    h.original.box={...h.original.box,top:-30,bottom:20};
    h.scroll(-300); h.observer.visible(h.original); h.step();
    assert.match(h.original.style.filter,/url/);
    assert.equal(Number(h.defs.children[0].children[4].attrs.scale),24);
    // A fast upward scroll lands in the clear reading zone. It must still
    // show a blur-to-sharp transition rather than skipping the entrance.
    h.original.box={...h.original.box,top:600,bottom:650};
    h.scroll(-630); h.step();
    assert.match(h.original.style.filter,/url/);
    assert.ok(h.frames.size>0);
    const scales=[];
    for(let i=0;i<8;i++) {h.step(); scales.push(Number(h.defs.children[0].children[4].attrs.scale));}
    assert.ok(scales[0]>scales[3]);
    assert.equal(h.original.style.filter,'contrast(1)');
    assert.equal(h.frames.size,0);
  };
  enterFromTop();
  h.observer.visible(h.original,false); h.step();
  enterFromTop();
});

test('ordinary text keeps its scroll entrance underneath a stationary cursor', t => {
  const h=harness(t);
  h.original.hovered=true;
  h.scroll(-200); h.observer.visible(h.original); h.step();
  assert.match(h.original.style.filter,/url/);
  h.original.focused=true; h.root.dispatchEvent(new Event('focusin')); h.step();
  assert.equal(h.original.style.filter,'contrast(1)');
  assert.equal(h.frames.size,0);
});

test('arrival floor handles both entry edges without hiding initial or focused text', () => {
  const arrival=liquid.createTextArrival();
  assert.deepEqual(arrival.sample(0,true,false,0),{amount:0,moving:false});
  arrival.sample(0,false,true,100);
  assert.deepEqual(arrival.sample(0,true,true,200),{amount:1,moving:true});
  assert.ok(arrival.sample(0,true,true,550).amount>0);
  assert.deepEqual(arrival.sample(0,true,true,900),{amount:0,moving:false});
  arrival.sample(0,false,true,1000);
  assert.equal(arrival.sample(0,true,true,1100).amount,1);
  assert.deepEqual(arrival.sample(0,true,false,1200),{amount:0,moving:false});
});

test('text discovery covers nested headings, body copy, captions and controls without selecting media or navigation', t => {
  class DomElement {
    constructor(tag, classes='', children=[]) {
      this.tag=tag; this.classes=classes.split(' '); this.children=[];
      for (const child of children) {
        const node=typeof child==='string' ? {textContent:child} : child;
        node.parentElement=this; this.children.push(node);
      }
    }
    matches(selector) {
      return selector.split(',').some(rule => rule.startsWith('.') ? this.classes.includes(rule.slice(1)) : rule===this.tag);
    }
    closest(selector) {
      for (let el=this; el; el=el.parentElement) if (el.matches(selector)) return el;
      return null;
    }
    querySelector(selector) {
      for (const child of this.children) if (child instanceof DomElement) {
        if (child.matches(selector)) return child;
        const match=child.querySelector(selector); if (match) return match;
      }
      return null;
    }
  }
  const el=(...args)=>new DomElement(...args);
  const heading=el('h1','',[el('span','',['Brands ']),el('span','hl',['worth remembering.'])]);
  const body=el('p','',['A body paragraph with ',el('strong','',['emphasis.'])]);
  const caption=el('h3','',['Chheda Jewellers']);
  const card=el('a','',[el('img'),caption]);
  const button=el('button','',[el('svg'),el('span','',['Listen to the voice note'])]);
  const quote=el('blockquote','',['A client testimonial.']);
  const footer=el('small','',['Contact us']);
  const root=el('body','',[
    el('nav','',[el('a','',['work'])]),el('span','apar-logo',['APAR']),
    el('main','',[heading,body,card,button,quote,el('textarea','',['Editable text'])]),
    el('footer','',[footer]),el('span','sr-only',['Only announced']),
  ]);
  const text=[];
  const walk=node=>{for(const child of node.children ?? []) child instanceof DomElement ? walk(child) : text.push(child);};
  walk(root);
  const doc=Object.getOwnPropertyDescriptor(globalThis,'document');
  const filter=Object.getOwnPropertyDescriptor(globalThis,'NodeFilter');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createTreeWalker:()=>{let i=0;return {nextNode:()=>text[i++]??null};}}});
  Object.defineProperty(globalThis,'NodeFilter',{configurable:true,value:{SHOW_TEXT:4}});
  t.after(()=>{
    if(doc) Object.defineProperty(globalThis,'document',doc); else delete globalThis.document;
    if(filter) Object.defineProperty(globalThis,'NodeFilter',filter); else delete globalThis.NodeFilter;
  });
  assert.deepEqual(liquid.collectLiquidText(root),[heading,body,caption,button,quote,footer]);
});
