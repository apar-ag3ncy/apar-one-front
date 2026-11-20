import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";
import { createSectionBend, sectionBendPath } from "@/lib/motion/section-bend";

export function mountSectionEdgeMotion(home: HTMLElement) {
  if (!("IntersectionObserver" in window)) return;
  const media = window.matchMedia(`${DESKTOP_MOTION_QUERY} and (forced-colors: none)`);
  const edges = Array.from(home.querySelectorAll<SVGSVGElement>(".section-scroll-edge"));
  const paths = new Map(edges.map(edge => [edge, edge.querySelector("path")!]));
  const visible = new Set<SVGSVGElement>();
  const motion = createSectionBend(window.scrollY, performance.now());
  let frame = 0;

  const flatten = (edge: SVGSVGElement) => paths.get(edge)!.setAttribute("d", sectionBendPath(0));
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    motion.reset(window.scrollY, performance.now());
    edges.forEach(flatten);
  };
  const draw = (now: number) => {
    frame = 0;
    if (document.hidden || !visible.size) return;
    const { bend, moving } = motion.tick(now);
    const path = sectionBendPath(bend);
    for (const edge of visible) {
      const shape = paths.get(edge)!;
      shape.style.fill = bend >= 0 ? "var(--edge-above)" : "var(--edge-below)";
      shape.setAttribute("d", path);
    }
    if (moving) frame = requestAnimationFrame(draw);
  };
  const queue = () => {
    if (!frame && visible.size && !document.hidden) frame = requestAnimationFrame(draw);
  };
  const scroll = () => {
    if (!visible.size || document.hidden) {
      motion.reset(window.scrollY, performance.now());
      return;
    }
    motion.sample(window.scrollY, performance.now());
    queue();
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const edge = entry.target as SVGSVGElement;
      if (entry.isIntersecting) visible.add(edge);
      else { visible.delete(edge); flatten(edge); }
    }
    if (visible.size) queue();
    else reset();
  });
  const stop = () => {
    observer.disconnect();
    visible.clear();
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("resize", reset);
    document.removeEventListener("visibilitychange", reset);
    reset();
  };
  const sync = () => {
    stop();
    if (!media.matches) return;
    edges.forEach(edge => observer.observe(edge));
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", reset);
    document.addEventListener("visibilitychange", reset);
  };
  sync();
  media.addEventListener("change", sync);
  return () => { stop(); media.removeEventListener("change", sync); };
}
