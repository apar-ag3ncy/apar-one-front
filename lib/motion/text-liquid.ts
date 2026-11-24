const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
/** Only the arriving edge blurs: lower edge when scrolling down, upper edge
 * when scrolling up. There is deliberately no exit effect or hero exception. */
export function textLiquidAmount(top: number, bottom: number, height: number, direction = 1) {
  if (height <= 0) return 0;
  return direction < 0
    ? smooth((0.32 - bottom / height) / 0.48)
    : smooth((top / height - 0.68) / 0.48);
}

/** Re-arm on viewport entry, from either edge. The 700ms time envelope always
 * finishes even when the reader stops scrolling in the entrance zone.
 * Within one visit the amount can only decrease, including direction changes.
 * Once readable, text stays readable until it has fully left the viewport. */
export function createTextArrival() {
  let wasVisible = false;
  let started: number | null = null;
  let clearest = 1;
  return {
    reset() { wasVisible = false; started = null; clearest = 1; },
    sample(wanted: number, visible: boolean, animate: boolean, now: number) {
      if (!visible) {
        wasVisible = false; started = null; clearest = 1;
        return { amount: 0, moving: false };
      }
      // Initial content and interacted-with controls stay clear for this visit.
      if (!animate) {
        wasVisible = true; started = null; clearest = 0;
        return { amount: 0, moving: false };
      }
      if (!wasVisible) started = now;
      wasVisible = true;
      clearest = Math.min(clearest, wanted);
      const pulse = started === null ? 0 : 1 - smooth((now - started) / 700);
      if (pulse === 0) started = null;
      const amount = Math.max(clearest, pulse) * pulse;
      return { amount, moving: amount > 0 };
    },
  };
}

export const LIQUID_TEXT_SKIP = 'script,style,noscript,svg,canvas,textarea,input,select,option,pre,code,nav,.nav,.mobile-menu,.apar-logo,.brand-tag,.ttu,.page-wipe,.testimonial-carousel,.case-quote,.cv-player,[role="dialog"],[contenteditable],[data-liquid-skip],.sr-only,.tc-sr-only,.hover-text-a11y';
const textGroup = '.hover-text,.pq-focus-word,h1,h2,h3,h4,h5,h6,p,blockquote,li,dt,dd,figcaption,label,legend,summary,button,a,th,td,caption';
const mixedContent = 'img,video,canvas,input,textarea,select,iframe,h1,h2,h3,h4,h5,h6,p,section,article,ul,ol,table';

/** Select text-only groups without replacing React nodes, adding wrappers,
 * changing accessible names, or applying filters to photos and card surfaces. */
export function collectLiquidText(root: HTMLElement) {
  const found = new Set<HTMLElement>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!node.textContent?.trim() || !parent || parent.closest(LIQUID_TEXT_SKIP)) continue;
    let target = parent.closest<HTMLElement>(textGroup) ?? parent;
    if (target.querySelector(mixedContent)) target = parent;
    if (target === root || target.querySelector(mixedContent) || target.closest(LIQUID_TEXT_SKIP)) continue;
    found.add(target);
  }
  return [...found].filter(target => {
    for (let parent = target.parentElement; parent && parent !== root; parent = parent.parentElement) {
      if (found.has(parent)) return false;
    }
    return true;
  });
}

const svgNS = 'http://www.w3.org/2000/svg';
let nextFilter = 0;

/** Allocated only while a visible label is melting, then returned to a pool. */
export function createLiquidFilter(defs: SVGDefsElement) {
  const make = (tag: string, attrs: Record<string, string>) => {
    const element = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    return element;
  };
  const id = `site-liquid-${++nextFilter}`;
  const filter = make('filter', { id, x:'-25%', y:'-60%', width:'150%', height:'220%', 'color-interpolation-filters':'sRGB' });
  const noise = make('feTurbulence', { type:'fractalNoise', baseFrequency:'0.008 0.015', numOctaves:'1', seed:'7', result:'noise' });
  const swell = make('feMorphology', { in:'SourceGraphic', operator:'dilate', radius:'0', result:'swollen' });
  const blur = make('feGaussianBlur', { in:'swollen', stdDeviation:'0', result:'merged' });
  const density = make('feColorMatrix', { in:'merged', type:'matrix', result:'liquid' });
  const warp = make('feDisplacementMap', { in:'liquid', in2:'noise', scale:'0', xChannelSelector:'R', yChannelSelector:'G', result:'warped' });
  const soften = make('feGaussianBlur', { in:'warped', stdDeviation:'0' });
  filter.append(noise, swell, blur, density, warp, soften);
  defs.append(filter);
  return {
    id,
    remove: () => filter.remove(),
    update(amount: number, fontSize: number) {
      const size = Math.max(12, Math.min(100, fontSize));
      swell.setAttribute('radius', (amount * size * 0.045).toFixed(3));
      blur.setAttribute('stdDeviation', (amount * size * 0.07).toFixed(3));
      density.setAttribute('values', `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${1 + amount * 13} ${-amount * 5}`);
      warp.setAttribute('scale', (amount * size * 0.5).toFixed(3));
      soften.setAttribute('stdDeviation', (amount * size * 0.012).toFixed(3));
    },
  };
}
