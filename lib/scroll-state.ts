// Shared "is the page actively scrolling" signal, driven by Lenis (see
// components/smooth-scroll.tsx). Decorative per-frame WebGL backdrops read this
// to skip their GPU render while scrolling, so they never compete with scroll
// compositing on weaker GPUs — they resume the moment scrolling settles.

let scrolling = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function markScrolling() {
  scrolling = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    scrolling = false;
  }, 150);
}

export function isScrolling() {
  return scrolling;
}
