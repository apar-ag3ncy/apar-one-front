"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CaseMotionProfile } from "@/lib/cases/motion";

/** Case pages own their media motion; global SlowMo deliberately excludes them. */
export function useCaseMotion(root: RefObject<HTMLElement | null>, profile: CaseMotionProfile) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      const ctx = gsap.context(() => {
        const hero = el.querySelector<HTMLElement>(".case-hero")!;
        const figure = el.querySelector<HTMLElement>(".case-hero-fig")!;
        const art = el.querySelector<HTMLElement>(".case-hero-media")!;
        if (profile.gallery) {
          const architectural = profile.form === "architecture";
          gsap.fromTo(art,
            { x: architectural ? 0 : 28 * profile.direction, y: architectural ? 38 : 24,
              rotation: profile.gallery.tilt, scale: profile.gallery.restingScale,
              clipPath: architectural ? "inset(12% 0% 0% 0%)" : "inset(5% 0% 5% 0%)", opacity: 0 },
            { x: 0, y: 0, rotation: 0, scale: 1, clipPath: "inset(0% 0% 0% 0%)", opacity: 1,
              duration: 1.5, delay: .12, ease: profile.opening });
        } else {
          gsap.from(art, { x: profile.direction * 64, y: 30, rotation: profile.direction * 1.4,
            scale: .96, opacity: 0, duration: 1.35, delay: .15, ease: "power3.out" });
        }
        gsap.to(figure, { y: -45, opacity: .4, ease: "none", scrollTrigger: {
          trigger: hero, start: "top top", end: "bottom top", scrub: .85,
        } });
        // All case text uses the shared, reversible liquid scroll effect.
        const next = el.querySelector(".case-next-art");
        if (next) gsap.fromTo(next, { y: 35, scale: 1.12 }, { y: 0, scale: 1, ease: "none", scrollTrigger: {
          trigger: el.querySelector(".case-next"), start: "top bottom", end: "bottom bottom", scrub: .7,
        } });
      }, el);
      return () => { ctx.revert(); };
    });
    return () => { media.revert(); };
  }, [root, profile]);
}
