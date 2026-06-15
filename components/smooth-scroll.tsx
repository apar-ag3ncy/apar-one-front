"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { markScrolling } from "@/lib/scroll-state";

/**
 * Lusion-style inertial scrolling (Lenis), driven from GSAP's ticker so
 * ScrollTrigger pins/scrubs stay perfectly in sync. Also routes same-page
 * anchor links through Lenis for a smooth glide.
 * No-ops entirely under prefers-reduced-motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    // Duration/easing (time-based) instead of lerp (frame-based): on a busy
    // machine that drops frames, a fixed lerp steps unevenly and reads as a
    // stuttery "catching-up" scroll. Time-based easing stays a consistent glide
    // regardless of frame rate.
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      // touch is left NATIVE (syncTouch defaults false); keep the multiplier at
      // 1 so finger-drag stays 1:1 — 1.6 made phone scroll feel fast/floaty.
      touchMultiplier: 1,
      gestureOrientation: "vertical",
    });

    lenis.on("scroll", () => {
      ScrollTrigger.update();
      markScrolling();
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Keep Lenis's cached scroll limits in lockstep with the real document height.
    // Videos, web fonts and images all change layout after first paint; without
    // this, Lenis's limits drift and scroll feels like it "stops short" / rubber-
    // bands near the bottom. Every ScrollTrigger.refresh now re-measures Lenis.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

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
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
