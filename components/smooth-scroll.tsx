"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { markScrolling, setLenis } from "@/lib/scroll-state";

/**
 * Lusion-style inertial scrolling (Lenis), driven from GSAP's ticker so
 * ScrollTrigger pins/scrubs stay perfectly in sync. Also routes same-page
 * anchor links through Lenis for a smooth glide.
 * No-ops entirely under prefers-reduced-motion.
 */
export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // A wheel notch starts a glide. If a route changes mid-glide, Next
  // scrolls the new page to the top natively but Lenis ignores that while it
  // animates and writes the OLD page's offset back on the next tick - the
  // destination opened scrolled down. Reset the glide before Next's own scroll
  // handling runs (layout effect: SmoothScroll mounts before the page tree).
  useLayoutEffect(() => {
    const l = lenisRef.current;
    // stop() + start() is the public way to reset(): both cancel the running
    // animation and re-sync the animated scroll to the real one. When Lenis is
    // already stopped (mobile menu open) it holds no glide, so nothing to cancel.
    if (l && !l.isStopped) {
      l.stop();
      l.start();
    }
  }, [pathname]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
    // Lenis smooths wheel input, while finger scrolling remains native. On
    // touch-first devices its always-running GSAP ticker does no smoothing and
    // competes with the page's canvas effects for each frame.
    if (matchMedia("(hover: none) and (pointer: coarse)").matches) {
      let alive = true;
      const onNativeScroll = () => markScrolling();
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      window.addEventListener("load", refresh);
      document.fonts?.ready.then(() => { if (alive) refresh(); }).catch(() => {});
      return () => {
        alive = false;
        window.removeEventListener("scroll", onNativeScroll);
        window.removeEventListener("load", refresh);
      };
    }
    let alive = true;
    // Duration/easing (time-based) instead of lerp (frame-based): on a busy
    // machine that drops frames, a fixed lerp steps unevenly and reads as a
    // stuttery "catching-up" scroll. Time-based easing stays a consistent glide
    // regardless of frame rate.
    const lenis = new Lenis({
      // One responsive easing layer. Scroll-linked media uses a short settle
      // below, so wheel input never queues up behind multiple long glides.
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      // touch is left NATIVE (syncTouch defaults false); keep the multiplier at
      // 1 so finger-drag stays 1:1 - 1.6 made phone scroll feel fast/floaty.
      touchMultiplier: 1,
      gestureOrientation: "vertical",
    });

    lenis.on("scroll", () => {
      ScrollTrigger.update();
      markScrolling();
    });
    setLenis(lenis);
    lenisRef.current = lenis;

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
    document.fonts?.ready.then(() => { if (alive) ScrollTrigger.refresh(); }).catch(() => {});

    // same-page hash links glide via Lenis instead of jumping
    const onClick = (ev: MouseEvent) => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as HTMLElement).closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      let target: HTMLElement | null = null;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { return; }
      if (!target) return;
      // The menu owns the lock; let its Next link handle navigation after close.
      if (lenis.isStopped) return;
      ev.preventDefault();
      // Keyboard focus / browser scrollIntoView can move the real viewport
      // while a glide still holds its old animatedScroll. Element targets use
      // that cached value, so reconcile it before calculating the destination.
      lenis.stop(); lenis.start();
      // Lenis already honours scroll-margin-top. Adding a nav offset as well
      // left case-page anchors 150px down the screen instead of at the gutter.
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      lenis.scrollTo(target, { offset: margin ? 0 : -70 });
    };
    document.addEventListener("click", onClick);

    return () => {
      alive = false;
      document.removeEventListener("click", onClick);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(raf);
      setLenis(null);
      lenisRef.current = null;
      lenis.destroy();
    };
    });
    return () => media.revert();
  }, []);

  return null;
}
