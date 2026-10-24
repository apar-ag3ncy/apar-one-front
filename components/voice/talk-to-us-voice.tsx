"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { VoiceConcierge } from "@/components/voice/voice-concierge";

export default function TalkToUsVoice() {
  return <ConversationProvider><VoiceConcierge /></ConversationProvider>;
}
