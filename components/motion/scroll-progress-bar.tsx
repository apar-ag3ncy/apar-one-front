"use client";

import { motion, useReducedMotion, useScroll, useSpring, type MotionValue } from "motion/react";
import { useMobileLayout } from "@/lib/motion-policy";

/** Thin red progress bar tracking page scroll depth. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const mobile = useMobileLayout();
  const reduced = useReducedMotion();
  return mobile || reduced
    ? <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    : <SpringProgress progress={scrollYProgress} />;
}

function SpringProgress({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useSpring(progress, { stiffness: 220, damping: 30, mass: 0.35, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}
