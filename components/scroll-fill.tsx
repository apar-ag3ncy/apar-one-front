"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll-fill text — each word inks in from grey to ink (red for accent words
 * wrapped in *asterisks*) as the statement scrolls through the viewport.
 * GSAP ScrollTrigger drives the progress. (Awwwards / Dribbble signature.)
 */
export function ScrollFill({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  const words = text.trim().split(/\s+/).map((w) => {
    const accent = /^\*.*\*[.,!?]?$/.test(w);
    return { clean: accent ? w.replace(/\*/g, "") : w, accent };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>(".fw"));
    if (reduce) {
      spans.forEach((s) => s.classList.add("lit"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      end: "bottom 55%",
      scrub: true,
      onUpdate: (self) => {
        const lit = Math.round(self.progress * spans.length);
        spans.forEach((s, i) => s.classList.toggle("lit", i < lit));
      },
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => st.kill();
  }, []);

  return (
    <p ref={ref} className={className} data-fill>
      {words.map((w, i) => (
        <span key={i}>
          <span className={"fw" + (w.accent ? " accent" : "")}>{w.clean}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
