"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { VoiceConcierge } from "./voice-concierge";

export default function TalkToUsVoice() {
  return <ConversationProvider><VoiceConcierge /></ConversationProvider>;
}
