"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin red progress bar tracking page scroll depth. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} />;
}
