"use client";

import Link from "next/link";
import { ConversationProvider } from "@elevenlabs/react";
import Strands from "@/components/react-bits/Strands";
import { VoiceConcierge } from "@/components/voice-concierge";
import { VOICE_CONCIERGE_ENABLED } from "@/lib/elevenlabs";

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
      <ConversationProvider>
        <VoiceConcierge />
      </ConversationProvider>
    );
  }
  return <TalkToUsFallback />;
}

function TalkToUsFallback() {
  return (
    <Link href="/#contact" className="ttu" aria-label="Talk to us">
      <span className="ttu-orb" aria-hidden="true">
        <Strands
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
        />
      </span>
      <span className="ttu-tip" aria-hidden="true">
        Talk to us
      </span>
    </Link>
  );
}
