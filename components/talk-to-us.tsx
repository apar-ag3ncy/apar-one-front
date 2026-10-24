"use client";

import { useMobileLayout } from "@/lib/motion-policy";
import Link from "next/link";
import { lazy, Suspense, useEffect, useState } from "react";
import { VOICE_CONCIERGE_ENABLED } from "@/lib/elevenlabs";

const TalkToUsVoice = lazy(() => import("./talk-to-us-voice"));
const Strands = lazy(() => import("@/components/react-bits/Strands"));

/**
 * Floating contact orb - a refractive glass "siri" (react-bits Strands) docked
 * bottom-right on every page. Lit with the brand's exact strand palette
 * (red → orange → gold), matching the stats band.
 *
 * When an ElevenLabs Agent is configured (NEXT_PUBLIC_ELEVENLABS_AGENT_ID), the
 * orb becomes a real, Siri-like voice call with APAR's concierge - tap to talk,
 * audio-reactive waveform, live captions. See lib/elevenlabs.ts + VOICE-CONCIERGE.md.
 *
 * Until then it gracefully falls back to its original behaviour: a link to the
 * on-page contact section. Nothing breaks before the agent is connected.
 */
export function TalkToUs() {
  if (VOICE_CONCIERGE_ENABLED) {
    return (
      <Suspense fallback={<TalkToUsFallback />}>
        <TalkToUsVoice />
      </Suspense>
    );
  }
  return <TalkToUsFallback />;
}

function TalkToUsFallback() {
  const mobile = useMobileLayout();
  const [orbReady, setOrbReady] = useState(false);
  useEffect(() => {
    // The decorative WebGL orb does not need to compete with the hero for
    // first paint, hydration, or its largest-contentful-paint window. The CSS
    // fallback has the same shape and keeps the contact link usable meanwhile.
    if (mobile) return;
    const timer = window.setTimeout(() => setOrbReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, [mobile]);
  return (
    <Link href="/#contact" className="ttu" aria-label="Talk to us">
      <span className="ttu-orb" aria-hidden="true">
        {orbReady && !mobile ? <Suspense fallback={<span className="ttu-orb-placeholder" />}><Strands
          colors={["#EB3B25", "#F0883B", "#F6C57A"]}
          count={5}
          speed={0.85}
          amplitude={1.3}
          waviness={1.1}
          thickness={0.85}
          glow={2.8}
          taper={1.8}
          spread={1}
          intensity={0.85}
          saturation={1.5}
          opacity={1}
          scale={1.4}
          glass
          refraction={1.1}
          dispersion={1}
          glassSize={1.05}
        /></Suspense> : <span className="ttu-orb-placeholder" />}
      </span>
      <span className="ttu-tip" aria-hidden="true">
        Talk to us
      </span>
    </Link>
  );
}
