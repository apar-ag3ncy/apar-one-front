/**
 * APAR voice concierge — ElevenLabs Agents (Conversational AI) config.
 *
 * The floating "Talk to us" orb becomes a real, Siri-like voice call with the
 * APAR brand concierge. It connects to an ElevenLabs Agent you create once in
 * the ElevenLabs dashboard. See VOICE-CONCIERGE.md for the full setup, the
 * concierge persona / system prompt, and the knowledge base to paste in.
 *
 * One-time setup:
 *   1. elevenlabs.io → Agents → create an agent (use the prompt in VOICE-CONCIERGE.md).
 *   2. Copy its Agent ID.
 *   3. Set  NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxx  in .env.local
 *      (or paste it into ELEVENLABS_AGENT_ID below).
 *
 * Until an Agent ID is set, the orb gracefully falls back to its original
 * behaviour — a link to the on-page contact section. Nothing breaks.
 */
export const ELEVENLABS_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? "";

/** The concierge's name, shown in the call UI. Match this in the agent prompt. */
export const CONCIERGE_NAME = "Aabha";

/** Whether the voice concierge is configured and should take over the orb. */
export const VOICE_CONCIERGE_ENABLED = ELEVENLABS_AGENT_ID.length > 0;
