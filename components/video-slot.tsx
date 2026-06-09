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

/**
 * Project video frame. Autoplays a muted, looping video from `src`. Until a
 * video file actually exists there, it shows the editorial drop-zone
 * placeholder — so dropping /public/videos/<slug>.mp4 is all that's needed,
 * no code change (mirrors how the logos work).
 */
export function VideoSlot({
  src,
  poster,
  placeholder = "Drop a video",
  radius = 5,
  className,
  style,
}: VideoSlotProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // React doesn't reliably set the `muted` DOM property from the attribute,
  // which blocks autoplay — force it muted and kick off playback on mount.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {
      /* autoplay can still be blocked; the loaded frame stays visible */
    });
  }, [src]);

  return (
    <div
      className={cn("img-slot", !ready && "ph-img", className)}
      style={{ borderRadius: `${radius}px`, ...style }}
      aria-label={placeholder}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={ref}
        className="video-slot-el"
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        data-ready={ready ? "true" : "false"}
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
      />
      {!ready && <span className="img-slot-cap">{placeholder}</span>}
    </div>
  );
}
