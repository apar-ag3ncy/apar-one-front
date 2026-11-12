"use client";

import { useMobileLayout } from "@/lib/motion-policy";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

/**
 * Magnetic wrapper - pulls its child toward the pointer, then springs back.
 * Used for buttons / CTAs (Motion).
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
  const prefersReduced = useReducedMotion();
  const mobile = useMobileLayout();
  const reduced = prefersReduced || mobile;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 24, mass: 0.55 });
  const sy = useSpring(y, { stiffness: 280, damping: 24, mass: 0.55 });
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const dirtyRef = useRef(true);

  useEffect(() => {
    if (reduced) { x.set(0); y.set(0); }
    dirtyRef.current = true;
  }, [reduced, x, y]);

  useEffect(() => {
    if (reduced) return;
    const markDirty = () => {
      dirtyRef.current = true;
      x.set(0);
      y.set(0);
    };
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty, { passive: true });
    return () => {
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
    };
  }, [reduced, x, y]);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    centerRef.current = {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    };
    dirtyRef.current = false;
  };

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse") return;
    if (dirtyRef.current || !centerRef.current) measure();
    const c = centerRef.current;
    if (!c) return;
    const pull = strength / (1 + strength);
    x.set(Math.max(-6, Math.min(6, (e.clientX - c.x) * pull)));
    y.set(Math.max(-4, Math.min(4, (e.clientY - c.y) * pull)));
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ display: "inline-flex" }}
      onPointerEnter={reduced ? undefined : measure}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onFocusCapture={reset}
    >
      <motion.div style={{ x: reduced ? 0 : sx, y: reduced ? 0 : sy, display: "inline-flex" }}>
        {children}
      </motion.div>
    </div>
  );
}
