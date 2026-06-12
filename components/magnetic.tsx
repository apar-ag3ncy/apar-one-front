"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Magnetic wrapper — pulls its child toward the pointer, then springs back.
 * Used for buttons / CTAs (Framer Motion).
 */
export function Magnetic({
  children,
  strength = 0.4,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const dirtyRef = useRef(true);

  useEffect(() => {
    const markDirty = () => {
      dirtyRef.current = true;
    };
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty, { passive: true });
    return () => {
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
    };
  }, []);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // subtract current spring offset to get the true resting center
    centerRef.current = {
      x: r.left + r.width / 2 - sx.get(),
      y: r.top + r.height / 2 - sy.get(),
    };
    dirtyRef.current = false;
  };

  const onMove = (e: React.MouseEvent) => {
    if (dirtyRef.current || !centerRef.current) measure();
    const c = centerRef.current;
    if (!c) return;
    const pull = strength / (1 + strength);
    x.set((e.clientX - c.x) * pull);
    y.set((e.clientY - c.y) * pull);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: "inline-flex" }}
      onMouseEnter={measure}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}
