"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { CaseMotionProfile } from "@/lib/cases/motion";

/** Case pages own their media motion; global SlowMo deliberately excludes them. */
export function useCaseMotion(root: RefObject<HTMLDivElement | null>, profile: CaseMotionProfile) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const media = gsap.matchMedia();
    let alive = true;
    media.add(DESKTOP_MOTION_QUERY, () => {
      let active = true;
      const splits: SplitText[] = [];
      const ctx = gsap.context(self => {
        const hero = el.querySelector<HTMLElement>(".case-hero")!;
        const figure = el.querySelector<HTMLElement>(".case-hero-fig")!;
        const art = el.querySelector<HTMLElement>(".case-hero-media")!;
        gsap.from(el.querySelectorAll(".case-eyebrow, .case-sub, .case-meta, .case-explore"), {
          y: 24, opacity: 0, duration: 1, stagger: .08, delay: .1, ease: profile.opening,
        });
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
        const arm = () => {
          if (!alive || !active) return;
          self.add(() => {
            const title = el.querySelector<HTMLElement>(".case-title");
            if (title) splits.push(SplitText.create(title, {
              type: "lines", mask: "lines", autoSplit: true,
              onSplit: split => gsap.from(split.lines, { yPercent: 105, duration: 1.2, stagger: .1, ease: profile.opening }),
            }));
            el.querySelectorAll<HTMLElement>(".case-lead").forEach(lead => {
              splits.push(SplitText.create(lead, { type: "words", wordsClass: "case-reveal-word" }));
              const words = lead.querySelectorAll(".case-reveal-word");
              gsap.from(words, { opacity: .3, y: 8, stagger: .04, ease: "none", scrollTrigger: {
                trigger: lead, start: "top 88%", end: "bottom 48%", scrub: .45,
              } });
            });
          });
        };
        if (document.fonts.status === "loaded") arm();
        else document.fonts.ready.then(arm).catch(arm);
        el.querySelectorAll<HTMLElement>(".case-stat .n").forEach(number => {
          gsap.from(number, { y: 18, scale: .95, opacity: .25, duration: 1.1, ease: "power3.out", scrollTrigger: {
            trigger: number, start: "top 90%", once: true,
          } });
        });
        const quote = el.querySelector(".case-quote blockquote");
        if (quote) gsap.from(quote, { y: 28, opacity: .2, ease: "none", scrollTrigger: {
          trigger: quote, start: "top 90%", end: "top 48%", scrub: .6,
        } });
        const next = el.querySelector(".case-next-art");
        if (next) gsap.fromTo(next, { y: 35, scale: 1.12 }, { y: 0, scale: 1, ease: "none", scrollTrigger: {
          trigger: el.querySelector(".case-next"), start: "top bottom", end: "bottom bottom", scrub: .7,
        } });
      }, el);
      return () => { active = false; splits.forEach(split => split.revert()); ctx.revert(); };
    });
    return () => { alive = false; media.revert(); };
  }, [root, profile]);
}
