"use client";

import { DESKTOP_MOTION_QUERY, useMobileLayout } from "@/lib/motion-policy";

import { Fragment, useEffect, useRef } from "react";
import { gsap } from "gsap";

/** Reference hover: a sideways, slanted letter fade followed by a clean return.
 * Only the glyphs move; the link/button keeps its hit area and layout position. */
export function HoverText({ children }: { children: string }) {
  const mobile = useMobileLayout();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const label = ref.current;
    const control = label?.closest<HTMLElement>("a,button");
    if (!label || !control) return;
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      const letters = Array.from(label.querySelectorAll<HTMLElement>(".hover-text-letter"));
      let over = false;
      let focused = false;
      let distance = 0;
      // Keep long contact addresses within the same restrained timing envelope.
      const stagger = Math.min(0.018, 0.18 / Math.max(letters.length - 1, 1));
      const cycle = gsap.timeline({ paused: true, onComplete: () => { label.dataset.hoverState = "active"; } });
      cycle.to(letters, { x: () => -distance, skewX: -18, opacity: 0,
        duration: 0.18, stagger, ease: "power2.in" }, 0);
      cycle.fromTo(letters, { x: () => distance, skewX: -18, opacity: 0 },
        { x: 0, skewX: 0, opacity: 1, duration: 0.36, stagger,
          ease: "power3.out", immediateRender: false }, 0.23);
      const settle = gsap.timeline({ paused: true, onComplete: () => { label.dataset.hoverState = "rest"; } })
        .to(letters, { x: 0, skewX: 0, opacity: 1, duration: 0.24,
          stagger: { amount: 0.06, from: "end" }, ease: "power3.out" });
      const activate = () => {
        if (control.matches(":disabled,[aria-disabled='true'],[aria-busy='true']")) return;
        distance = parseFloat(getComputedStyle(label).fontSize) * 0.65;
        settle.pause();
        label.dataset.hoverState = "rolling";
        cycle.invalidate().restart();
      };
      const deactivate = () => {
        if (over || focused) return;
        cycle.pause();
        label.dataset.hoverState = "settling";
        settle.invalidate().restart();
      };
      const enter = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        over = true;
        if (!focused) activate();
      };
      const leave = () => { over = false; deactivate(); };
      const focus = () => {
        if (!control.matches(":focus-visible")) return;
        focused = true;
        if (!over) activate();
      };
      const blur = () => { focused = false; deactivate(); };
      const cancel = () => { over = false; focused = false; deactivate(); };
      control.addEventListener("pointerenter", enter);
      control.addEventListener("pointerleave", leave);
      control.addEventListener("pointercancel", cancel);
      control.addEventListener("focus", focus);
      control.addEventListener("blur", blur);
      window.addEventListener("blur", cancel);
      return () => {
        control.removeEventListener("pointerenter", enter);
        control.removeEventListener("pointerleave", leave);
        control.removeEventListener("pointercancel", cancel);
        control.removeEventListener("focus", focus);
        control.removeEventListener("blur", blur);
        window.removeEventListener("blur", cancel);
        delete label.dataset.hoverState;
      };
    }, label);
    return () => media.revert();
  }, [children, mobile]);

  if (mobile) return <span className="hover-text">{children}</span>;
  return <span ref={ref} className="hover-text">
    <span className="hover-text-a11y">{children}</span>
    <span className="hover-text-visual" aria-hidden="true">
      {children.split(/(\s+)/).map((word, i) => /^\s+$/.test(word)
        ? <Fragment key={i}>{word}</Fragment>
        : <span className="hover-text-word" key={i}>{Array.from(word).map((letter, j) =>
          <span className="hover-text-letter" key={j}>{letter}</span>)}</span>)}
    </span>
  </span>;
}
