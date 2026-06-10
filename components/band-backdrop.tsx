"use client";

import { PixelDome } from "./pixel-dome";

/**
 * BandBackdrop — the dark-band background: an Algolia-style hero glow built from
 * thousands of tiny pixels (one soft horizon arc). Sits behind the band content
 * (z-index 0) on a near-black base, click-through; a soft shimmer follows the
 * pointer.
 */
export function BandBackdrop({ domeY = -0.15, intensity = 1 }: { domeY?: number; intensity?: number }) {
  return (
    <div className="band-bg" aria-hidden>
      <PixelDome cell={7} domeY={domeY} intensity={intensity} />
    </div>
  );
}
