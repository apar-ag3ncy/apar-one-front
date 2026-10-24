"use client";

import { useMobileLayout } from "@/lib/motion-policy";
import { useEffect, useRef } from "react";

/**
 * LiquidGlass - the "liquid" under the case pages' glass.
 *
 * A fixed, click-through layer behind a case study's content: four large,
 * pre-softened radial gradients in the page's OWN palette (--c-bg2, the accent
 * tint, a light tint of the ink, a deep shade) drift very slowly, so the colour
 * visibly moves beneath every `.glass` pane above it. A fine SVG-noise grain
 * and a diagonal sheen sit on top so the surface reads as material, not a flat
 * fill.
 *
 * Softness comes from the gradient stops, NOT `filter: blur()` - nothing here
 * rasterises per frame. The drift is driven from JS, on 2-D transforms, and
 * ONLY while the page is still: a CSS animation (even paused) keeps each blob
 * on its own compositor layer under the entire page, which forces everything
 * above it into separate layers and was measured (docs/adr/0002) to cost the
 * case pages roughly half their scroll frame rate. With no active animation
 * during scroll the page rasters as one document, and the fixed backdrop
 * sliding under the moving panes already reads as colour moving under glass.
 * The drift's phase only advances while idle, so it resumes where it stopped -
 * no jump. Honours prefers-reduced-motion (no drift at all).
 * Styles: globals.css, "LIQUID GLASS (case pages)". Rendered once by <CaseStudy>.
 */

// Per-blob drift: amplitude (vw, vh), scale swing, and period (s). Slow and
// unequal periods so the four never fall into step.
const DRIFT = [
  { ax: 8, ay: 6, s: 0.11, p: 30 },
  { ax: -9, ay: 8, s: -0.09, p: 38 },
  { ax: 10, ay: -7, s: 0.12, p: 44 },
  { ax: -7, ay: -9, s: -0.08, p: 52 },
];
const IDLE_AFTER = 180; // ms without a scroll event before the drift resumes

export function LiquidGlass() {
  const mobile = useMobileLayout();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || mobile) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const blobs = Array.from(el.querySelectorAll<HTMLElement>(".lg-blob"));

    let raf = 0;
    let phase = 0; // seconds of idle drift so far - advances only while idle
    let prev = 0;
    let scrollTimer = 0;
    let scrolling = false;

    const frame = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 0.1) : 0;
      prev = now;
      phase += dt;
      const vw = window.innerWidth / 100, vh = window.innerHeight / 100;
      for (let i = 0; i < blobs.length; i++) {
        const d = DRIFT[i];
        // triangle-ish ease: 0 -> 1 -> 0 over one period, smoothed by the sine
        const k = 0.5 - 0.5 * Math.cos((phase / d.p) * Math.PI * 2);
        const x = (d.ax * k * vw).toFixed(1), y = (d.ay * k * vh).toFixed(1);
        blobs[i].style.transform = `translate(${x}px, ${y}px) scale(${(1 + d.s * k).toFixed(4)})`;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || document.hidden || reduced.matches) return;
      prev = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // Native scroll fires for Lenis-driven and native (touch) scrolling alike.
    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        stop();
      }
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrolling = false;
        start();
      }, IDLE_AFTER);
    };
    const onVisibility = () => (document.hidden ? stop() : scrolling ? undefined : start());
    const onMotionChange = () => reduced.matches ? stop() : start();

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotionChange);
    start();
    return () => {
      stop();
      window.clearTimeout(scrollTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotionChange);
    };
  }, [mobile]);

  return (
    <div ref={ref} className="lg-backdrop" aria-hidden="true">
      <i className="lg-blob lg-a" />
      <i className="lg-blob lg-b" />
      <i className="lg-blob lg-c" />
      <i className="lg-blob lg-d" />
    </div>
  );
}
