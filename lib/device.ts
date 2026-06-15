"use client";

import { useEffect, useState } from "react";

/**
 * Heuristic for "this device can't comfortably run several full-viewport WebGL
 * layers at 60fps." Used to drop the decorative GPU effects (pixel-dome beams,
 * strands ribbons, fluid cursor) on weak hardware and under reduced-motion, so
 * scrolling stays buttery on any device. Capable desktops/flagship phones keep
 * the full effect; everything else gets a static CSS fallback.
 *
 * SSR-safe: returns true (= "low power", render the cheap fallback) on the
 * server and on first client paint, then `useHeavyFx` upgrades after mount.
 */
export function isLowPowerDevice(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4)
    return true;
  return false;
}

/**
 * Gate heavy WebGL/canvas effects with this. Renders the static fallback on the
 * server and first paint (so SSR/hydration match), then enables the effect only
 * after mount on a capable device.
 */
export function useHeavyFx(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (isLowPowerDevice()) return;
    // Defer one frame so the heavy GL init never competes with first paint.
    const id = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return enabled;
}
