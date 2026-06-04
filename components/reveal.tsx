"use client";

import { motion } from "framer-motion";
import { useMemo, type ComponentProps, type ElementType } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  as?: ElementType;
  /** stagger index — adds 90ms * i delay, matching the original .reveal --i */
  i?: number;
  delay?: number;
} & ComponentProps<typeof motion.div> & { href?: string; "data-cat"?: string };

// Cache motion-wrapped custom components (e.g. next/link) so motion.create()
// isn't called on every render.
const motionCache = new Map<ElementType, ElementType>();

/**
 * Framer Motion port of the design's `.reveal` — fade + rise on scroll-in,
 * spring-eased, with optional stagger index. `as` accepts a string tag or a
 * component (e.g. next/link's Link), so cards can be real routed links.
 */
export function Reveal({ as = "div", i = 0, delay = 0, children, ...props }: RevealProps) {
  const MotionTag = useMemo<ElementType>(() => {
    if (typeof as === "string") {
      return (motion as unknown as Record<string, ElementType>)[as];
    }
    let cached = motionCache.get(as);
    if (!cached) {
      cached = motion.create(as as React.ComponentType) as ElementType;
      motionCache.set(as, cached);
    }
    return cached;
  }, [as]);

  return (
    <MotionTag
      initial={{ opacity: 0, y: 38 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -7% 0px" }}
      transition={{ duration: 1, ease: EASE, delay: delay + i * 0.09 }}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
