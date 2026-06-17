"use client";

import { useEffect, useState } from "react";
import Prism from "./react-bits/Prism";

/**
 * PrismBackdrop — the stats-band background: a slowly turning raymarched prism
 * (React Bits "Prism", ogl/WebGL) in APAR's gold↔orange palette, glowing on the
 * band's near-black base. Replaces the earlier Strands ribbons. Click-through;
 * pauses when the band scrolls out of view.
 *
 * `scale` is responsive: the band is taller on phones (stats stack), so a
 * smaller prism keeps it a contained beam instead of washing the numbers.
 */
export function PrismBackdrop() {
  const [scale, setScale] = useState(3.6);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setScale(mq.matches ? 2.3 : 3.6);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="band-bg" aria-hidden>
      <Prism
        animationType="rotate"
        timeScale={0.5}
        height={3.5}
        baseWidth={5.5}
        scale={scale}
        hueShift={0}
        colorFrequency={1}
        noise={0.4}
        glow={1.1}
        bloom={1.2}
        suspendWhenOffscreen
      />
    </div>
  );
}
