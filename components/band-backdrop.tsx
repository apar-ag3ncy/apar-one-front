"use client";

import { PixelDome } from "./pixel-dome";

/**
 * BandBackdrop — the dark-band background: the Algolia-style hero glow built
 * from thousands of tiny tiles (one curved beam, pale peach crown + vivid
 * orange band). Sits behind the band content (z-index 0) on a near-black base,
 * click-through; a soft shimmer follows the pointer.
 */
export function BandBackdrop({ domeY = -0.15, intensity = 1 }: { domeY?: number; intensity?: number }) {
  return (
    <div className="band-bg" aria-hidden>
      <PixelDome cell={20} domeY={domeY} intensity={intensity} />
    </div>
  );
}
