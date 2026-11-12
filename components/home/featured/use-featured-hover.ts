"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

/** Caption motion is independent of the optional curved image renderer. */
export function useFeaturedHover(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!root.current) return;
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      const cleanups: (() => void)[] = [];
      root.current?.querySelectorAll<HTMLElement>(".flow-project").forEach(card => {
        const title = card.querySelector<HTMLElement>("h3");
        const arrow = card.querySelector<HTMLElement>(".flow-project-arrow");
        const letters = Array.from(card.querySelectorAll<HTMLElement>(".flow-letter-stack"));
        const windows = Array.from(card.querySelectorAll<HTMLElement>(".flow-letter-window"));
        if (!title || !arrow) return;
        const targets = [arrow, ...letters, ...windows];
        let over = false, focused = false, active = false;
        gsap.set(arrow, { xPercent: -100, autoAlpha: 0 });
        const activate = () => {
          if (active) return;
          active = true;
          const size = parseFloat(getComputedStyle(title).fontSize);
          gsap.to(arrow, { xPercent: 0, autoAlpha: 1, duration: 0.65, ease: "power3.out", overwrite: true });
          gsap.to(windows, { x: size * 1.5, duration: 0.65, stagger: 0.012,
            ease: "power3.inOut", overwrite: true });
          gsap.to(letters, { yPercent: -50, duration: 0.65, stagger: 0.012,
            ease: "power3.inOut", overwrite: true });
        };
        const deactivate = () => {
          if (over || focused) return;
          active = false;
          gsap.to(arrow, { xPercent: -100, autoAlpha: 0, duration: 0.5, ease: "power3.inOut", overwrite: true });
          gsap.to(windows, { x: 0, duration: 0.65, stagger: { each: 0.008, from: "end" },
            ease: "power3.inOut", overwrite: true });
          gsap.to(letters, { yPercent: 0, duration: 0.65, stagger: { each: 0.008, from: "end" },
            ease: "power3.inOut", overwrite: true });
        };
        const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") { over = true; activate(); } };
        const leave = () => { over = false; deactivate(); };
        const focus = () => { focused = true; activate(); };
        const blur = () => { focused = false; deactivate(); };
        card.addEventListener("pointerenter", enter);
        card.addEventListener("pointerleave", leave);
        card.addEventListener("focusin", focus);
        card.addEventListener("focusout", blur);
        cleanups.push(() => {
          card.removeEventListener("pointerenter", enter);
          card.removeEventListener("pointerleave", leave);
          card.removeEventListener("focusin", focus);
          card.removeEventListener("focusout", blur);
          gsap.killTweensOf(targets);
          gsap.set(targets, { clearProps: "transform,opacity,visibility,willChange" });
        });
      });
      return () => cleanups.forEach(cleanup => cleanup());
    });
    return () => media.revert();
  }, [root]);
}
