"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Marquee } from "./magicui/marquee";
import { useHeavyFx } from "@/lib/device";

const WORDS = [
  { t: "Branding", out: false },
  { t: "AI Content", out: true },
  { t: "Marketing", out: false },
  { t: "Campaigns", out: true },
  { t: "Strategy", out: false },
];

/**
 * Oversized velocity marquee — Magic UI Marquee for the infinite scroll,
 * Framer Motion scroll-velocity mapped to a live skewY (the "velocity skew").
 */
export function VelocityMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "20% 0px" });
  const reduce = useReducedMotion();
  const heavy = useHeavyFx();
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { stiffness: 200, damping: 50, restDelta: 0.01 });
  const skew = useTransform(smooth, [-2000, 0, 2000], [-4, 0, 4], { clamp: true });
  // The live velocity-skew is a per-scroll-frame repaint; only run it on capable,
  // motion-OK devices that are in view. Low-power/touch keep the plain marquee.
  const skewOn = inView && heavy && !reduce;

  return (
    <motion.div ref={ref} className="vmarquee" style={skewOn ? { skewY: skew } : undefined} aria-hidden>
      <Marquee className="vtrack" pauseOnHover repeat={4}>
        {WORDS.map((w, i) => (
          <span key={i} className={w.out ? "out" : undefined}>
            {w.t}
          </span>
        ))}
      </Marquee>
    </motion.div>
  );
}
