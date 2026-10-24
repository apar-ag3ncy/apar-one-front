"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

/** Pointer motion and the letter/arrow exchange share one scoped card lifecycle. */
export function useFeaturedHover(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!root.current) return;
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      const cleanups: (() => void)[] = [];
      root.current?.querySelectorAll<HTMLElement>(".flow-project").forEach(card => {
        const image = card.querySelector<HTMLImageElement>(".photo-slot-img");
        const title = card.querySelector<HTMLElement>("h3");
        const arrow = card.querySelector<HTMLElement>(".flow-project-arrow");
        const letters = Array.from(card.querySelectorAll<HTMLElement>(".flow-letter-stack"));
        const windows = Array.from(card.querySelectorAll<HTMLElement>(".flow-letter-window"));
        const frame = card.querySelector<HTMLElement>(".flow-project-image");
        if (!image || !title || !arrow || !frame) return;
        const targets = [image, arrow, ...letters, ...windows];
        let over = false, focused = false, active = false;
        let bounds = frame.getBoundingClientRect();
        const xTo = gsap.quickTo(image, "x", { duration: 0.8, ease: "power3.out" });
        const yTo = gsap.quickTo(image, "y", { duration: 0.8, ease: "power3.out" });
        gsap.set(arrow, { xPercent: -100, autoAlpha: 0 });
        const activate = () => {
          if (active) return;
          active = true;
          bounds = frame.getBoundingClientRect();
          image.style.willChange = "transform";
          const size = parseFloat(getComputedStyle(title).fontSize);
          gsap.to(image, { scale: 1.025, duration: 1.05, ease: "power3.out", overwrite: "auto" });
          gsap.to(arrow, { xPercent: 0, autoAlpha: 1, duration: 0.65, ease: "power3.out", overwrite: true });
          gsap.to(windows, { x: size * 1.5, duration: 0.65, stagger: 0.012,
            ease: "power3.inOut", overwrite: true });
          gsap.to(letters, { yPercent: -50, duration: 0.65, stagger: 0.012,
            ease: "power3.inOut", overwrite: true });
        };
        const deactivate = () => {
          if (over || focused) return;
          active = false;
          xTo(0); yTo(0);
          gsap.to(image, { scale: 1, duration: 0.9, ease: "power3.out", overwrite: "auto",
            onComplete: () => { if (!active) image.style.willChange = ""; } });
          gsap.to(arrow, { xPercent: -100, autoAlpha: 0, duration: 0.5, ease: "power3.inOut", overwrite: true });
          gsap.to(windows, { x: 0, duration: 0.65, stagger: { each: 0.008, from: "end" },
            ease: "power3.inOut", overwrite: true });
          gsap.to(letters, { yPercent: 0, duration: 0.65, stagger: { each: 0.008, from: "end" },
            ease: "power3.inOut", overwrite: true });
        };
        const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") { over = true; activate(); } };
        const leave = () => { over = false; deactivate(); };
        const move = (e: PointerEvent) => {
          if (!over || e.pointerType !== "mouse") return;
          const x = gsap.utils.clamp(-0.5, 0.5, (e.clientX - bounds.left) / bounds.width - 0.5);
          const y = gsap.utils.clamp(-0.5, 0.5, (e.clientY - bounds.top) / bounds.height - 0.5);
          xTo(-x * 8); yTo(-y * 8);
        };
        const focus = () => { focused = true; activate(); };
        const blur = () => { focused = false; deactivate(); };
        const measure = () => { if (active) bounds = frame.getBoundingClientRect(); };
        card.addEventListener("pointerenter", enter);
        card.addEventListener("pointerleave", leave);
        card.addEventListener("pointermove", move, { passive: true });
        card.addEventListener("focusin", focus);
        card.addEventListener("focusout", blur);
        window.addEventListener("scroll", measure, { passive: true });
        cleanups.push(() => {
          card.removeEventListener("pointerenter", enter);
          card.removeEventListener("pointerleave", leave);
          card.removeEventListener("pointermove", move);
          card.removeEventListener("focusin", focus);
          card.removeEventListener("focusout", blur);
          window.removeEventListener("scroll", measure);
          gsap.killTweensOf(targets);
          gsap.set(targets, { clearProps: "transform,opacity,visibility,willChange" });
        });
      });
      return () => cleanups.forEach(cleanup => cleanup());
    });
    return () => media.revert();
  }, [root]);
}
