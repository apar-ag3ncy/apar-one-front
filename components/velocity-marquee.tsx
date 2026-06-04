"use client";

import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
} from "framer-motion";
import { Marquee } from "./magicui/marquee";

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
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { stiffness: 200, damping: 50 });
  const skew = useTransform(smooth, [-2000, 0, 2000], [-4, 0, 4], { clamp: true });

  return (
    <motion.div className="vmarquee" style={{ skewY: skew }} aria-hidden>
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
