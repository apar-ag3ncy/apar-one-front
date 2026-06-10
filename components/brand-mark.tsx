"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AparLogo } from "./apar-logo";

/**
 * BrandMark — the big APAR wordmark for the brand band, rendered as TYPE (no
 * image, no jagged cutout): a clean, heavy, solid-colour wordmark using the
 * brand's own multi-script "A". Reveals with an Apple-style focus-in
 * (soft → sharp + gentle scale/fade). No tilt, no gradient.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export function BrandMark({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className ? `bb-wordmark ${className}` : "bb-wordmark"}
      initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.06, filter: "blur(14px)" }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1.3, ease: EASE }}
    >
      <AparLogo />
    </motion.div>
  );
}
