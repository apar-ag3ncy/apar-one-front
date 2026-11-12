"use client";

import { useEffect, type RefObject } from "react";
import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

/** One renderer for the complete grid, requested shortly before it enters view. */
export function useFeaturedScroll(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const grid = root.current;
    if (!grid) return;
    const media = matchMedia(DESKTOP_MOTION_QUERY);
    let observer: IntersectionObserver | undefined;
    let dispose: (() => void) | undefined;
    let generation = 0;
    const sync = () => {
      const current = ++generation;
      observer?.disconnect(); dispose?.(); dispose = undefined;
      if (!media.matches) return;
      observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer?.disconnect();
        void import("./featured-scroll-runtime").then(({ mountFeaturedScroll }) => {
          if (current === generation && media.matches) dispose = mountFeaturedScroll(grid);
        }).catch(() => { /* The existing HTML photographs remain visible. */ });
      }, { rootMargin: "320px" });
      observer.observe(grid);
    };
    sync(); media.addEventListener("change", sync);
    return () => {
      generation++; observer?.disconnect(); dispose?.();
      media.removeEventListener("change", sync);
    };
  }, [root]);
}
