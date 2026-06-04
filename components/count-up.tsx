"use client";

import { useEffect, useRef, useState } from "react";

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
  const ref = useRef<HTMLSpanElement>(null);
  const dec = (String(to).split(".")[1] || "").length;
  const [val, setVal] = useState("0");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(el);
          const t0 = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal((to * eased).toFixed(dec) + suffix);
            if (p < 1) requestAnimationFrame(step);
            else setVal(to.toFixed(dec) + suffix);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix, duration, dec]);

  return <span ref={ref}>{val}</span>;
}
