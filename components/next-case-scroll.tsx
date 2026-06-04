"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCaseTransition } from "./transition-provider";

/**
 * When the visitor reaches the very bottom of a case study and keeps
 * scrolling, a "pull" meter fills; once full, a seamless full-screen
 * transition (via TransitionProvider) plays and routes straight to the next
 * client. Normal scrolling is untouched — the meter only accumulates once
 * already at the bottom.
 */
export function NextCaseScroll({
  href,
  name,
  color,
  ink,
}: {
  href: string;
  name: string;
  color: string;
  ink: string;
}) {
  const router = useRouter();
  const startTransition = useCaseTransition();
  const barRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pull = { v: 0 };
    let locked = false;
    let raf = 0;
    let lastTouch = 0;
    const armAt = performance.now() + 700;

    const atBottom = () =>
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.scrollHeight - 4;

    const trigger = () => {
      if (locked) return;
      locked = true;
      if (reduce) router.push(href);
      else startTransition({ href, color, ink, label: name });
    };

    const add = (amount: number) => {
      if (locked || amount <= 0 || performance.now() < armAt || !atBottom()) return;
      pull.v = Math.min(1, pull.v + amount);
      if (pull.v >= 1) trigger();
    };

    const onWheel = (e: WheelEvent) => add(e.deltaY / 700);
    const onTouchStart = (e: TouchEvent) => {
      lastTouch = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      add((lastTouch - y) / 320);
      lastTouch = y;
    };

    const loop = () => {
      if (!locked && pull.v > 0) pull.v = Math.max(0, pull.v - 0.012);
      if (barRef.current) barRef.current.style.transform = `scaleX(${pull.v})`;
      if (wrapRef.current) wrapRef.current.classList.toggle("show", pull.v > 0.02);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [href, name, color, ink, router, startTransition]);

  return (
    <div ref={wrapRef} className="next-pull" aria-hidden>
      <span className="next-pull-label">
        Keep scrolling — Next: <strong>{name}</strong>
      </span>
      <div className="next-pull-bar">
        <i ref={barRef} />
      </div>
    </div>
  );
}
