// Shared "is the page actively scrolling" signal, driven by Lenis (see
// components/motion/smooth-scroll.tsx). Decorative per-frame WebGL backdrops read this
// to skip their GPU render while scrolling, so they never compete with scroll
// compositing on weaker GPUs - they resume the moment scrolling settles.

let lastScrollAt = -Infinity;

export function markScrolling() {
  // No timer creation/cancellation on every animation frame.
  lastScrollAt = performance.now();
}

export function isScrolling() {
  return performance.now() - lastScrollAt < 150;
}

// The live Lenis instance (registered by components/smooth-scroll.tsx) so the
// nav can actually lock scrolling while the mobile menu is open: `body{overflow:
// hidden}` only blocks user scrolling of the viewport, while Lenis scrolls the
// window programmatically and sails straight through it.
type ScrollLock = { stop: () => void; start: () => void; isStopped?: boolean; scrollTo?: (target: number, options?: { duration?: number }) => void };
let lenisRef: ScrollLock | null = null;
export function setLenis(l: ScrollLock | null) {
  lenisRef = l;
}
export function getLenis() {
  return lenisRef;
}
