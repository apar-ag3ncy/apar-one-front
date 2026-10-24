"use client";

import { useMobileLayout } from "@/lib/motion-policy";
import { useEffect, useRef } from "react";

/** Count-up number that fires once when scrolled into view. */
export function CountUp({
  to,
  suffix = "",
  duration = 1400,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const mobile = useMobileLayout();
  const ref = useRef<HTMLSpanElement>(null);
  const dec = (String(to).split(".")[1] || "").length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let alive = true;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (mobile || reduced.matches || duration <= 0) {
      el.textContent = to.toFixed(dec) + suffix;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(el);
          const t0 = performance.now();
          let lastWrite = -Infinity;
          const step = (now: number) => {
            if (!alive) return;
            if (reduced.matches) { el.textContent = to.toFixed(dec) + suffix; return; }
            const p = Math.min(1, (now - t0) / duration);
            if (p < 1) {
              if (now - lastWrite >= 80) {
                lastWrite = now;
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = (to * eased).toFixed(dec) + suffix;
              }
              frame = requestAnimationFrame(step);
            } else {
              el.textContent = to.toFixed(dec) + suffix;
            }
          };
          frame = requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => { alive = false; cancelAnimationFrame(frame); io.disconnect(); };
  }, [to, suffix, duration, dec, mobile]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {to.toFixed(dec)}{suffix}
    </span>
  );
}
