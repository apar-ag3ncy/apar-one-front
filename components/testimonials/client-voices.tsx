"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { voiceTime, voiceWaveform, type ClientVoice } from "@/lib/client-voices";

export function ClientVoices({ notes }: { notes: ClientVoice[] }) {
  const active = useRef<HTMLAudioElement | null>(null);
  const activate = (audio: HTMLAudioElement) => {
    if (active.current !== audio) active.current?.pause();
    active.current = audio;
  };
  if (!notes.length) return null;
  return <section className="client-voices" aria-labelledby="client-voices-title">
    <div className="cv-heading"><h3 id="client-voices-title">In their own <em>words.</em></h3>
      <span className="cv-heading-mark" aria-hidden="true">↗</span></div>
    <div className="cv-grid">{notes.map(note => <VoicePlayer key={note.id} note={note} activate={activate} />)}</div>
  </section>;
}

function VoicePlayer({ note, activate }: { note: ClientVoice; activate: (audio: HTMLAudioElement) => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const request = useRef(0);
  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(note.duration);
  const active = phase === "playing" || phase === "loading";
  const progress = duration > 0 ? Math.min(100, time / duration * 100) : 0;
  const wave = useMemo(() => voiceWaveform(note.peaks), [note.peaks]);

  useEffect(() => {
    const audio = ref.current;
    return () => {
      if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    };
  }, []);

  const toggle = async () => {
    const audio = ref.current;
    if (!audio) return;
    const id = ++request.current;
    if (active) { audio.pause(); setPhase("paused"); return; }
    activate(audio);
    setPhase("loading");
    // No audio request during page load. Set the source and invoke play in
    // the tap handler so Safari retains the user's playback activation.
    if (!audio.getAttribute("src") || phase === "error") {
      audio.src = note.src;
      audio.load();
    }
    if (audio.ended) { audio.currentTime = 0; setTime(0); }
    try { await audio.play(); }
    catch (error) {
      if (ref.current !== audio || request.current !== id) return;
      setPhase(error instanceof DOMException && error.name === "AbortError" ? "paused" : "error");
    }
  };

  const seek = (value: number) => {
    const audio = ref.current;
    if (!audio) return;
    setTime(value);
    if (audio.readyState > 0) audio.currentTime = value;
    else pendingSeek.current = value;
  };

  return <article className="cv-card" data-playing={phase === "playing"} aria-label={`Voice testimonial from ${note.name}`}>
    <div className="cv-identity"><span className="cv-label">Client voice</span>
      <h4>{note.name}</h4>{note.brand && <p>{note.brand}</p>}</div>
    <div className="cv-controls">
      <button type="button" className="cv-play" onClick={toggle} data-loading={phase === "loading"}
        aria-label={`${active ? "Pause" : phase === "error" ? "Retry" : "Play"} ${note.name}'s voice note`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{active
          ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
          : <path d="M8 4.5v15l12-7.5z" />}</svg>
      </button>
      <div className="cv-track">
        <div className="cv-wave" aria-hidden="true"><svg viewBox="0 0 600 64" preserveAspectRatio="none"><path d={wave} /></svg>
          <svg className="cv-wave-progress" viewBox="0 0 600 64" preserveAspectRatio="none" style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}><path d={wave} /></svg></div>
        <input className="cv-seek" type="range" min={0} max={duration} step={.1} value={Math.min(time, duration)}
          onChange={event => seek(Number(event.target.value))} aria-label={`Seek within ${note.name}'s voice note`}
          aria-valuetext={`${voiceTime(time)} of ${voiceTime(duration)}`} />
        <div className="cv-time" aria-hidden="true"><span>{voiceTime(time)}</span><span>{voiceTime(duration)}</span></div>
      </div>
    </div>
    {phase === "error" && <p className="cv-error" role="status">Couldn’t play this note. Tap play to retry.</p>}
    <audio ref={ref} preload="none" aria-hidden="true"
      onLoadedMetadata={() => {
        const audio = ref.current!;
        if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
        if (pendingSeek.current !== null) {
          audio.currentTime = Math.min(pendingSeek.current, Number.isFinite(audio.duration) ? audio.duration : note.duration);
          pendingSeek.current = null;
        }
      }}
      onTimeUpdate={() => setTime(ref.current?.currentTime ?? 0)}
      onPlaying={() => setPhase("playing")}
      onWaiting={() => { if (!ref.current?.paused) setPhase("loading"); }}
      onPause={() => setPhase(value => value === "error" ? value : "paused")}
      onEnded={() => setPhase("paused")}
      onError={() => setPhase("error")} />
  </article>;
}
