"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface VideoSlotProps {
  /** Video file, e.g. /videos/<slug>.mp4 */
  src: string;
  /** Optional poster image shown before the video plays. */
  poster?: string;
  placeholder?: string;
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

/* ----------------------------------------------------------------------------
 * Shared playback coordinator — caps how many videos decode at once.
 *
 * The work gallery alone holds a dozen <video>s. On weaker GPUs (Intel), letting
 * every video that drifts near the viewport call play() at once means several
 * H.264 streams decode + composite simultaneously, which stalls the main thread
 * for hundreds of ms during scroll (the "laggy scroll"). This module-level
 * coordinator keeps at most MAX_CONCURRENT playing — the ones closest to the
 * viewport centre — and pauses the rest. Reconciliation is rAF-batched so a
 * burst of IntersectionObserver callbacks during a fast scroll collapses into a
 * single pass.
 * ------------------------------------------------------------------------- */
const MAX_CONCURRENT = 2;
const wanting = new Set<HTMLVideoElement>(); // near viewport, would like to play
const playing = new Set<HTMLVideoElement>(); // currently allowed to play
let scheduled = false;

function centreDistance(v: HTMLVideoElement) {
  const r = v.getBoundingClientRect();
  const dy = r.top + r.height / 2 - window.innerHeight / 2;
  const dx = r.left + r.width / 2 - window.innerWidth / 2;
  return Math.abs(dy) + Math.abs(dx) * 0.5; // prefer vertical centring, weight horizontal less
}

function reconcile() {
  scheduled = false;
  const ranked = [...wanting].sort((a, b) => centreDistance(a) - centreDistance(b));
  const allow = new Set(ranked.slice(0, MAX_CONCURRENT));
  for (const v of playing) {
    if (!allow.has(v)) {
      v.pause();
      playing.delete(v);
    }
  }
  for (const v of allow) {
    if (!playing.has(v)) {
      v.play().catch(() => {
        /* autoplay can still be blocked; the loaded frame stays visible */
      });
      playing.add(v);
    }
  }
}

function schedulePlayback() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(reconcile);
}

function requestPlay(v: HTMLVideoElement) {
  wanting.add(v);
  schedulePlayback();
}

function releasePlay(v: HTMLVideoElement) {
  wanting.delete(v);
  if (playing.has(v)) {
    v.pause();
    playing.delete(v);
  }
  schedulePlayback();
}

/**
 * Project video frame. Autoplays a muted, looping video from `src`. Until a
 * video file actually exists there, it shows the editorial drop-zone
 * placeholder — so dropping /public/videos/<slug>.mp4 is all that's needed,
 * no code change (mirrors how the logos work). Playback is governed by the
 * shared coordinator above so only a couple of clips ever decode at once.
 */
export function VideoSlot({
  src,
  poster,
  placeholder = "Drop a video",
  radius = 5,
  className,
  style,
}: VideoSlotProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);

  // The <video> only mounts once the frame first comes near the viewport
  // (and then stays mounted, so it's never refetched when scrolled away).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "25%" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // React doesn't reliably set the `muted` DOM property from the attribute,
  // which blocks autoplay — force it muted. Actual playback is routed through
  // the shared coordinator (requestPlay/releasePlay): the frame registers
  // intent when it's near the viewport, and the coordinator decides whether it
  // gets to decode, capping concurrent playback to keep scrolling smooth.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en?.isIntersecting) requestPlay(v);
        else releasePlay(v);
      },
      { rootMargin: "0px" }
    );
    io.observe(v);
    return () => {
      io.disconnect();
      releasePlay(v);
    };
  }, [near, src]);

  return (
    <div
      ref={wrapRef}
      className={cn("img-slot", !ready && "ph-img", className)}
      style={{ borderRadius: `${radius}px`, ...style }}
      aria-label={placeholder}
    >
      {near && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={ref}
          className="video-slot-el"
          src={src}
          poster={poster}
          loop
          muted
          playsInline
          preload="metadata"
          data-ready={ready ? "true" : "false"}
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
        />
      )}
      {!ready && <span className="img-slot-cap">{placeholder}</span>}
    </div>
  );
}
