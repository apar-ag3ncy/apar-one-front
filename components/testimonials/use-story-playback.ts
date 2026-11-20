"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createStoryPlayback } from "@/lib/motion/story-playback";

export function useStoryPlayback(area: RefObject<HTMLDivElement | null>, count: number, advance: () => void) {
  const controller = useRef<ReturnType<typeof createStoryPlayback> | null>(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const root = area.current;
    if (!root || count < 2) return;
    const playback = createStoryPlayback(advance, setPlaying);
    controller.current = playback;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = () => document.hidden ? playback.pause("hidden") : playback.resume("hidden");
    const preference = () => {
      setReduced(motion.matches);
      if (motion.matches) playback.pause("reduced"); else playback.resume("reduced");
    };
    const enter = (event: PointerEvent) => { if (event.pointerType === "mouse") playback.pause("hover"); };
    const leave = (event: PointerEvent) => { if (event.pointerType === "mouse") playback.resume("hover"); };
    const focus = () => playback.pause("focus");
    const blur = (event: FocusEvent) => { if (!root.contains(event.relatedTarget as Node | null)) playback.resume("focus"); };
    const down = () => playback.pause("pointer");
    const up = () => playback.resume("pointer");
    const interaction = () => playback.restart();
    const recordings = () => Array.from(root.querySelectorAll("audio"));
    const syncVoice = () => {
      if (recordings().some(audio => !audio.paused && !audio.ended && !audio.error)) playback.pause("voice");
      else playback.resume("voice");
    };
    const startVoice = (event: Event) => {
      if (!(event.target instanceof HTMLAudioElement) || event.target.paused) return;
      for (const audio of recordings()) {
        if (audio !== event.target && !audio.paused) audio.pause();
      }
      syncVoice();
    };
    root.addEventListener("play", startVoice, true);
    const voiceStops = ["pause", "ended", "error"];
    for (const type of voiceStops) root.addEventListener(type, syncVoice, true);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= .4) playback.resume("offscreen");
      else playback.pause("offscreen");
    }, { threshold: [0, .4] });
    observer.observe(root);
    preference(); visibility();
    if (root.matches(":hover") && matchMedia("(hover: hover)").matches) playback.pause("hover");
    if (root.contains(document.activeElement)) playback.pause("focus");
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    root.addEventListener("focusin", focus);
    root.addEventListener("focusout", blur);
    root.addEventListener("wheel", interaction, { passive: true });
    root.addEventListener("scroll", interaction, { capture: true, passive: true });
    motion.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      root.removeEventListener("play", startVoice, true);
      for (const type of voiceStops) root.removeEventListener(type, syncVoice, true);
      playback.dispose(); controller.current = null; observer.disconnect();
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      root.removeEventListener("focusin", focus);
      root.removeEventListener("focusout", blur);
      root.removeEventListener("wheel", interaction);
      root.removeEventListener("scroll", interaction, true);
      motion.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [area, count, advance]);

  useEffect(() => {
    if (paused) controller.current?.pause("manual"); else controller.current?.resume("manual");
  }, [paused, count, advance]);

  return { paused, playing, reduced, togglePause: () => setPaused(value => !value) };
}
