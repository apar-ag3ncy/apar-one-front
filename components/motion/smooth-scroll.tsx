"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";
import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { markScrolling, setLenis } from "@/lib/scroll-state";
import { focusAnchor, samePageAnchor } from "@/lib/motion/anchor-navigation";
import { journeyWheelDelta } from "@/components/journey/flight";

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
    media.add(DESKTOP_MOTION_QUERY, () => {
    let alive = true;
    // Lenis normalizes damping by elapsed time, including on 120Hz displays.
    // Wheel input follows a short, continuous settle instead of restarting a
    // long duration-based easing curve on every event. Links get their own
    // finite duration below; touch scrolling remains native.
    const lenis = new Lenis({
      lerp: 0.12,
      autoRaf: false,
      syncTouch: false,
      smoothWheel: true,
      wheelMultiplier: 1,
      virtualScroll(sample) {
        const { event } = sample;
        if (event.type === "wheel" && event.target instanceof Element &&
            event.target.closest("[data-journey-ready]") && !event.target.closest("dialog")) {
          sample.deltaY = journeyWheelDelta(sample.deltaY, window.innerHeight);
        }
        return true;
      },
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
    // Move the viewport before GSAP paints this frame's animation positions.
    gsap.ticker.add(raf, false, true);
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
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = ev.target instanceof Element ? ev.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const anchor = samePageAnchor(a.href, location.href);
      if (!anchor) return;
      const target = document.getElementById(anchor.id);
      if (!target) return;
      // The menu owns the lock; let its Next link handle navigation after close.
      if (lenis.isStopped) return;
      ev.preventDefault();
      // Preserve Next's history metadata and the native Back/bookmark behaviour.
      if (location.hash !== anchor.hash) history.pushState(history.state, "", anchor.hash);
      // Keyboard focus / browser scrollIntoView can move the real viewport
      // while a glide still holds its old animatedScroll. Element targets use
      // that cached value, so reconcile it before calculating the destination.
      lenis.stop(); lenis.start();
      // Lenis already honours scroll-margin-top. Adding a nav offset as well
      // left case-page anchors 150px down the screen instead of at the gutter.
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const previousFocus = document.activeElement;
      lenis.scrollTo(target, {
        offset: margin || padding ? 0 : -84,
        duration: 0.85,
        lerp: 0,
        onComplete: () => {
          // A user tabbing away during the glide owns the new focus position.
          if (alive && target.isConnected && document.activeElement === previousFocus) focusAnchor(target);
        },
      });
    };
    // Run before Next's bubbling Link handler so one navigation owns the scroll.
    document.addEventListener("click", onClick, true);

    return () => {
      alive = false;
      document.removeEventListener("click", onClick, true);
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
