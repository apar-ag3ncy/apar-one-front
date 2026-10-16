"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const LIMIT_SECONDS = 60;
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"];

type Phase = "closed" | "ready" | "recording" | "review" | "sending" | "sent";

export function VoiceFeedback() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [consent, setConsent] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const pieces = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const started = useRef(0);
  const timer = useRef<number>(0);
  const previewUrl = useRef("");
  const requestId = useRef(0);
  const discardOnStop = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const consentInput = useRef<HTMLInputElement>(null);

  const releaseMic = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };
  const clearPreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = ""; setPreview(""); blob.current = null;
  };
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    window.clearInterval(timer.current);
    releaseMic();
  };
  useEffect(() => () => {
    requestId.current += 1;
    discardOnStop.current = true;
    window.clearInterval(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  const begin = async () => {
    const currentRequest = ++requestId.current;
    discardOnStop.current = false;
    setError(""); clearPreview(); setConsent(false);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording is unavailable in this browser. Try a current browser over HTTPS."); return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (currentRequest !== requestId.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const mimeType = TYPES.find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) { releaseMic(); setError("This browser does not support a compatible audio format."); return; }
      const current = new MediaRecorder(media, { mimeType, audioBitsPerSecond: 64_000 });
      recorder.current = current; pieces.current = [];
      current.ondataavailable = event => { if (event.data.size) pieces.current.push(event.data); };
      current.onerror = () => { stop(); setError("Recording failed. Please try again."); setPhase("ready"); };
      current.onstop = () => {
        if (discardOnStop.current) { pieces.current = []; releaseMic(); return; }
        const recording = new Blob(pieces.current, { type: mimeType });
        releaseMic();
        if (recording.size < 200) { setError("The recording was too short. Please try again."); setPhase("ready"); return; }
        if (recording.size > MAX_BYTES) { setError("The recording exceeded 4 MB. Please try a shorter note."); setPhase("ready"); return; }
        blob.current = recording;
        previewUrl.current = URL.createObjectURL(recording);
        setPreview(previewUrl.current); setPhase("review");
      };
      started.current = Date.now(); setSeconds(0);
      current.start(250); setPhase("recording");
      timer.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - started.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= LIMIT_SECONDS) stop();
      }, 250);
    } catch { releaseMic(); if (currentRequest === requestId.current) setError("Microphone access is unavailable. Check your browser permission and try again."); }
  };

  const submit = async () => {
    if (!blob.current) { setError("Record a voice note before sending it."); return; }
    if (name.trim().length < 2) { setError("Enter your name (at least two characters) to send your note."); nameInput.current?.focus(); return; }
    if (!consent) { setError("Tick the privacy box to send your note to APĀR."); consentInput.current?.focus(); return; }
    setError(""); setPhase("sending");
    const form = new FormData();
    const mime = blob.current.type.split(";")[0];
    form.append("recording", blob.current, `feedback.${mime === "audio/mp4" ? "m4a" : mime === "audio/ogg" ? "ogg" : "webm"}`);
    form.append("name", name.trim()); form.append("brand", brand.trim());
    form.append("duration", String(Math.max(1, Math.min(LIMIT_SECONDS, seconds))));
    form.append("consent", "yes"); form.append("website", "");
    try {
      const result = await fetch("/api/voice-feedback", { method: "POST", body: form });
      if (!result.ok) {
        const payload = await result.json().catch(() => ({}));
        throw new Error(payload.error || "Could not send the recording. Please try again.");
      }
      clearPreview(); setName(""); setBrand(""); setConsent(false); setPhase("sent");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send the recording."); setPhase("review"); }
  };

  const close = () => { requestId.current += 1; discardOnStop.current = true; stop(); clearPreview(); setError(""); setConsent(false); setPhase("closed"); };
  return <div className="vf-wrap">
    {phase !== "closed" && <div className="vf-panel" role="group" aria-label="Private voice feedback">
      <div className="vf-panel-head"><div><span className="vf-eyebrow">A NOTE FOR APĀR</span><h3>Tell us in your own voice.</h3></div><button type="button" className="vf-close" onClick={close} aria-label="Close voice feedback">×</button></div>
      {phase === "sent" ? <p className="vf-message" role="status">Thank you. Your note has been sent privately to our team.</p> : <>
        <p className="vf-help">{phase === "review" ? "Listen back, enter your name, tick the privacy box, then send. Your note stays private." : "Up to one minute. You can listen back before sending. This recording is private and will not appear on the website."}</p>
        <label className="vf-field">Your name <input ref={nameInput} autoComplete="name" maxLength={80} value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="Your name" disabled={phase === "sending" || phase === "recording"} /></label>
        <label className="vf-field">Brand / project <span>(optional)</span><input maxLength={80} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Your brand" disabled={phase === "sending" || phase === "recording"} /></label>
        <label className="vf-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        {phase === "review" && preview && <audio className="vf-audio" controls preload="metadata" src={preview} aria-label="Review your voice note" />}
        {phase === "recording" && <p className="vf-recording" role="status"><span className="vf-rec-dot" /> Recording · {seconds}s / {LIMIT_SECONDS}s</p>}
        {error && <p className="vf-error" role="alert">{error}</p>}
        {phase === "review" && <label className="vf-consent"><input ref={consentInput} type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setError(""); }} /> I agree to send this recording privately to APĀR for feedback.</label>}
        <div className="vf-actions">
          {(phase === "ready" || phase === "review") && <button type="button" className="vf-action" onClick={begin}>{phase === "review" ? "Record again" : "Start recording"}</button>}
          {phase === "recording" && <button type="button" className="vf-action" onClick={stop}>Stop recording</button>}
          {phase === "review" && <button type="button" className="vf-action vf-action--send" onClick={submit}>Send privately ↗</button>}
          {phase === "sending" && <span className="vf-sending" role="status">Sending securely…</span>}
        </div>
      </>}
    </div>}
    <button type="button" className="vf-trigger" aria-expanded={phase !== "closed"} aria-label={phase === "closed" ? "Leave APĀR a private voice note" : "Close private voice note"} onClick={() => phase === "closed" ? setPhase("ready") : close()}>
      <span className="vf-orb" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}</span>
      <span>{phase === "closed" ? "Leave a voice note" : "Close voice note"}</span>
    </button>
  </div>;
}
