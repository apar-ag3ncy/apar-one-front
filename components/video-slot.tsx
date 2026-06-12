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
  // which blocks autoplay — force it muted. Playback (and so video decoding)
  // runs only while the frame is near the viewport: with many videos on a
  // page, decoding them all at once tanks scrolling performance.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en?.isIntersecting) {
          if (!v.paused) return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (v.paused) {
              v.play().catch(() => {
                /* autoplay can still be blocked; the loaded frame stays visible */
              });
            }
          }, 150);
        } else {
          clearTimeout(timer);
          if (!v.paused) v.pause();
        }
      },
      { rootMargin: "25%" }
    );
    io.observe(v);
    return () => {
      clearTimeout(timer);
      io.disconnect();
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
