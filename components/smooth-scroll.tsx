"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lusion-style inertial scrolling (Lenis), driven from GSAP's ticker so
 * ScrollTrigger pins/scrubs stay perfectly in sync. Also:
 *  - feeds scroll velocity into the global `--scroll-skew` CSS var (used for
 *    the subtle motion-skew on the work cards),
 *  - routes same-page anchor links through Lenis for a smooth glide.
 * No-ops entirely under prefers-reduced-motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const root = document.documentElement;

    lenis.on("scroll", (e: { velocity: number }) => {
      ScrollTrigger.update();
      const skew = Math.max(-1, Math.min(1, e.velocity * 0.02));
      root.style.setProperty("--scroll-skew", skew.toFixed(3));
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // same-page hash links glide via Lenis instead of jumping
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      ev.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -70 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
      root.style.removeProperty("--scroll-skew");
    };
  }, []);

  return null;
}
