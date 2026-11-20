const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const early = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return 1 - (1 - t) * (1 - t);
};

/** Long entry from 116% to 68%; exit starts at 58% and ends at 12%.
 * An ease-out exit makes the first scroll movement visibly affect the text.
 * Use the bottom edge for exit so long paragraphs remain readable. */
export function textLiquidAmount(top: number, bottom: number, height: number, heroTop?: number) {
  if (height <= 0) return 0;
  if (heroTop !== undefined) return early(-heroTop / (height * 0.7));
  return Math.max(smooth((top / height - 0.68) / 0.48), early((0.58 - bottom / height) / 0.46));
}

/** Re-arm on every viewport entry, from either edge. A short reveal floor
 * prevents a fast scroll from skipping straight from offscreen to sharp text.
 * The normal scroll mapping stays immediate; only fresh arrivals get a pulse. */
export function createTextArrival() {
  let wasVisible = false;
  let started: number | null = null;
  return {
    reset() { wasVisible = false; started = null; },
    sample(wanted: number, visible: boolean, animate: boolean, now: number) {
      if (!visible || !animate) started = null;
      else if (!wasVisible) started = now;
      wasVisible = visible;
      const pulse = started === null ? 0 : 1 - smooth((now - started) / 700);
      if (pulse === 0) started = null;
      return { amount: Math.max(wanted, pulse), moving: pulse > wanted && pulse > 0 };
    },
  };
}

export const LIQUID_TEXT_SKIP = 'script,style,noscript,svg,canvas,textarea,input,select,option,pre,code,nav,.nav,.mobile-menu,.apar-logo,.brand-tag,.ttu,.page-wipe,[role="dialog"],[contenteditable],[data-liquid-skip],.sr-only,.tc-sr-only,.hover-text-a11y';
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
