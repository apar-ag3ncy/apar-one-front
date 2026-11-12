"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

/** The collage keeps its grid; only the photographs travel inside their crops. */
export function BentoMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      const grid = root.current;
      if (!grid) return;
      grid.dataset.motionReady = "true";
      const cleanups: (() => void)[] = [];
      for (const tile of grid.querySelectorAll<HTMLElement>(".home-bento-tile")) {
        const image = tile.querySelector("img");
        if (!image) continue;
        gsap.set(image, { scale: 1.1 });
        gsap.fromTo(image, { yPercent: -3 }, {
          yPercent: 3, ease: "none",
          scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: .3 },
        });
        const zoom = gsap.quickTo(image, "scale", { duration: .9, ease: "power3.out" });
        let over = false, focused = false;
        const enter = () => { over = true; zoom(1.13); };
        const leave = () => { over = false; if (!focused) zoom(1.1); };
        const focus = () => { focused = true; zoom(1.13); };
        const blur = () => { focused = false; if (!over) zoom(1.1); };
        tile.addEventListener("pointerenter", enter); tile.addEventListener("pointerleave", leave);
        tile.addEventListener("focusin", focus); tile.addEventListener("focusout", blur);
        cleanups.push(() => {
          tile.removeEventListener("pointerenter", enter); tile.removeEventListener("pointerleave", leave);
          tile.removeEventListener("focusin", focus); tile.removeEventListener("focusout", blur);
        });
      }
      return () => { cleanups.forEach(cleanup => cleanup()); delete grid.dataset.motionReady; };
    }, root);
    return () => media.revert();
  }, []);
  return <div ref={root} className="home-bento-grid">{children}</div>;
}
