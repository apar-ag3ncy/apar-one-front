"use client";

import Link from "next/link";
import { lazy, Suspense } from "react";
import { VOICE_CONCIERGE_ENABLED } from "@/lib/elevenlabs";
import { ContactOrb } from "@/components/voice/contact-orb";

const TalkToUsVoice = lazy(() => import("@/components/voice/talk-to-us-voice"));

/**
 * Floating contact orb - a refractive glass "siri" (react-bits Strands) docked
 * bottom-right on every page. Lit with the brand's exact strand palette
 * (red → orange → gold), matching the stats band.
 *
 * When an ElevenLabs Agent is configured (NEXT_PUBLIC_ELEVENLABS_AGENT_ID), the
 * orb becomes a real, Siri-like voice call with APAR's concierge - tap to talk,
 * audio-reactive waveform, live captions. See lib/elevenlabs.ts + docs/voice-concierge.md.
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
  return (
    <Link href="/#contact" className="ttu" aria-label="Talk to us">
      <ContactOrb />
      <span className="ttu-tip" aria-hidden="true">
        Talk to us
      </span>
    </Link>
  );
}
