"use client";

import { useEffect, useRef, type ComponentType, type ElementType, type HTMLAttributes } from "react";
import { gsap } from "gsap";
import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  i?: number;
  delay?: number;
  href?: string;
  "data-cat"?: string;
};

/** Visible HTML first. Only unseen desktop content gets a scroll entrance. */
export function Reveal({ as = "div", i = 0, delay = 0, children, ...props }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      // Slow hydration, restored scroll and direct hashes must never hide
      // content the visitor can already see or is using with the keyboard.
      if (el.getBoundingClientRect().top < window.innerHeight || el.contains(document.activeElement)) return;
      const interactive = el.matches("a,button") || el.querySelector("a,button,input,select,textarea");
      const tween = gsap.from(el, {
        y: 24, ...(interactive ? {} : { opacity: 0 }), paused: true,
        duration: .8, delay: Math.min(.21, Math.max(0, delay + i * .07)),
        ease: "power4.out",
      });
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        tween.play();
      }, { rootMargin: "0px 0px 12% 0px" });
      // Start slightly before entering the screen. Interactive cards remain
      // opaque throughout, and keyboard focus bypasses the entrance entirely.
      const show = () => { observer.disconnect(); tween.progress(1); };
      observer.observe(el);
      el.addEventListener("focusin", show);
      return () => { observer.disconnect(); el.removeEventListener("focusin", show); };
    });
    return () => media.revert();
  }, [as, delay, i]);

  const Tag = as as ComponentType<Record<string, unknown>>;
  return <Tag {...props} ref={ref} data-static-reveal>{children}</Tag>;
}
