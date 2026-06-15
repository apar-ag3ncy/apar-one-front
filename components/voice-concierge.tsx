"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, PhoneOff, X } from "lucide-react";
import Strands from "@/components/react-bits/Strands";
import { CONCIERGE_NAME, ELEVENLABS_AGENT_ID } from "@/lib/elevenlabs";

/** Brand strand palette (red → orange → gold), shared with the stats band. */
const STRAND_COLORS = ["#EB3B25", "#F0883B", "#F6C57A"] as const;

/** The living "siri" glass orb — same look as the original floating button. */
const ORB_PROPS = {
  colors: [...STRAND_COLORS],
  count: 5,
  speed: 0.85,
  amplitude: 1.3,
  waviness: 1.1,
  thickness: 0.85,
  glow: 2.8,
  taper: 1.8,
  spread: 1,
  intensity: 0.85,
  saturation: 1.5,
  opacity: 1,
  scale: 1.4,
  glass: true,
  refraction: 1.1,
  dispersion: 1,
  glassSize: 1.05,
};

const BARS = 28;

type Phase = "idle" | "requesting" | "connecting" | "live" | "denied" | "error";

/**
 * The premium, Siri-like voice concierge. The floating brand orb becomes a real
 * voice call with APAR's concierge ("Aabha") via an ElevenLabs Agent: tap to
 * talk, an audio-reactive waveform + halo, live captions set in the brand serif.
 *
 * Must be rendered inside a <ConversationProvider> (see talk-to-us.tsx).
 */
export function VoiceConcierge() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [caption, setCaption] = useState("");

  const conversation = useConversation({
    onConnect: () => setPhase("live"),
    onDisconnect: () => {
      setPhase("idle");
      setCaption("");
    },
    onError: () => setPhase("error"),
    onMessage: (props) => {
      // Surface the agent's words as live captions; ignore our own transcript.
      if (props.role === "agent" && props.message) setCaption(props.message);
    },
  });

  const { status, isSpeaking, isMuted, setMuted } = conversation;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speakingRef = useRef(isSpeaking);
  speakingRef.current = isSpeaking;

  // ── Start / end the call ────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    setOpen(true);
    setCaption("");
    setPhase("requesting");
    try {
      // Ask for the mic up front so we can show a graceful "denied" state.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setPhase("denied");
      return;
    }
    setPhase("connecting");
    conversation.startSession({
      agentId: ELEVENLABS_AGENT_ID,
      connectionType: "webrtc",
    });
  }, [conversation]);

  const endCall = useCallback(() => {
    conversation.endSession();
    setOpen(false);
    setPhase("idle");
    setCaption("");
  }, [conversation]);

  // End the session if the component unmounts mid-call.
  useEffect(() => {
    return () => {
      conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape for a native, dismissible feel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endCall();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, endCall]);

  // ── Audio-reactive waveform + orb halo (real frequency data) ─────────────
  useEffect(() => {
    if (status !== "connected") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const data = speakingRef.current
        ? conversation.getOutputByteFrequencyData()
        : conversation.getInputByteFrequencyData();
      const n = data.length;

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#EB3B25");
      grad.addColorStop(0.5, "#F0883B");
      grad.addColorStop(1, "#F6C57A");
      ctx.fillStyle = grad;

      const gap = w / BARS;
      const bw = gap * 0.42;
      let sum = 0;
      for (let i = 0; i < BARS; i++) {
        // Sample across the meaningful part of the spectrum.
        const idx = n ? Math.floor((i / BARS) * (n * 0.7)) : 0;
        const v = n ? data[idx] / 255 : 0;
        sum += v;
        const bh = Math.max(h * 0.06, v * h * 0.92);
        const x = i * gap + (gap - bw) / 2;
        const y = (h - bh) / 2;
        const r = bw / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, r);
        ctx.fill();
      }

      // Feed the average level to the orb halo via a CSS variable.
      const level = Math.min(1, (sum / BARS) * 1.8);
      canvas.style.setProperty("--vc-level", level.toFixed(3));
      const orb = canvas
        .closest(".vc-panel")
        ?.querySelector<HTMLElement>(".vc-orb");
      if (orb) orb.style.setProperty("--vc-level", level.toFixed(3));

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [status, conversation]);

  // ── Status copy ─────────────────────────────────────────────────────────
  const statusLine = (() => {
    switch (phase) {
      case "requesting":
        return "Allow your microphone…";
      case "connecting":
        return `Connecting to ${CONCIERGE_NAME}…`;
      case "denied":
        return "Microphone access is needed to talk.";
      case "error":
        return "Something went wrong. Try again.";
      case "live":
        return isSpeaking ? `${CONCIERGE_NAME} is speaking…` : "Listening…";
      default:
        return "";
    }
  })();

  const live = phase === "live";
  const busy = phase === "requesting" || phase === "connecting";

  return (
    <>
      {/* Floating launcher orb (hidden while the call panel is open). */}
      {!open && (
        <button
          type="button"
          className="ttu ttu-button"
          aria-label={`Talk to ${CONCIERGE_NAME}, APAR's voice concierge`}
          onClick={startCall}
        >
          <span className="ttu-orb" aria-hidden="true">
            <Strands {...ORB_PROPS} />
          </span>
          <span className="ttu-tip" aria-hidden="true">
            Talk to us
          </span>
        </button>
      )}

      {/* Voice call panel */}
      {open && (
        <div
          className="vc-panel"
          role="dialog"
          aria-modal="false"
          aria-label={`Voice call with ${CONCIERGE_NAME}, APAR concierge`}
        >
          <div className="vc-head">
            <div className="vc-id">
              <span className="vc-name">{CONCIERGE_NAME}</span>
              <span className="vc-role">APAR Concierge</span>
            </div>
            <button
              type="button"
              className="vc-x"
              aria-label="Close"
              onClick={endCall}
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          <div
            className={`vc-orb${live && isSpeaking ? " is-speaking" : ""}${
              busy ? " is-busy" : ""
            }`}
            aria-hidden="true"
          >
            <Strands {...ORB_PROPS} />
          </div>

          <div className="vc-status" aria-live="polite">
            <span className={`vc-dot${live ? " is-live" : ""}`} />
            {statusLine}
          </div>

          <canvas
            ref={canvasRef}
            className={`vc-wave${live ? " is-live" : ""}`}
            aria-hidden="true"
          />

          {caption && live ? (
            <p className="vc-caption" aria-live="polite">
              {caption}
            </p>
          ) : phase === "denied" || phase === "error" ? (
            <p className="vc-caption vc-caption-muted">
              {phase === "denied"
                ? "Enable the microphone in your browser, then tap to retry."
                : "We couldn't connect just now."}
            </p>
          ) : null}

          <div className="vc-controls">
            {phase === "denied" || phase === "error" ? (
              <button type="button" className="vc-retry" onClick={startCall}>
                Try again
              </button>
            ) : (
              <button
                type="button"
                className={`vc-mute${isMuted ? " is-muted" : ""}`}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={isMuted}
                onClick={() => setMuted(!isMuted)}
                disabled={!live}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <button
              type="button"
              className="vc-end"
              aria-label="End call"
              onClick={endCall}
            >
              <PhoneOff size={18} strokeWidth={2.2} />
              <span>End</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
