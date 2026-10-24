"use client";

import { cn } from "@/lib/utils";
import { useImageState } from "./use-image-state";
import type { CSSProperties } from "react";

type Shape = "rect" | "rounded" | "circle" | "pill";

interface ImageSlotProps {
  shape?: Shape;
  radius?: number;
  placeholder?: string;
  /** Image file (e.g. /work/<slug>/hero.jpg). When set and the file loads, it
   *  cover-fills the slot at the slot's own ratio. Omit it - or point at a file
   *  that doesn't exist yet - and, if a `logo` is given, the branded logo card
   *  shows; otherwise the editorial drop-zone placeholder shows instead (no
   *  broken image, no layout shift). */
  src?: string;
  /** Brand logo (e.g. /logos/<slug>.png) used as a tasteful branded fallback
   *  when there is no campaign `src`. Rendered centered and fully contained
   *  (never cropped) on a dark card with a subtle APAR-red glow, at a fixed
   *  ratio so the masonry stays tidy. Ignored when `src` loads. */
  logo?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Image frame for the design bundle's drag-and-drop <image-slot>. With no `src`
 * (or a missing file) it renders the editorial gradient placeholder (.ph-img)
 * with a caption; once a real image loads it cover-fills the frame edge-to-edge,
 * keeping the slot's designed aspect ratio.
 */
export function ImageSlot(props: ImageSlotProps) {
  return <ImageFrame key={props.src ?? `identity:${props.logo ?? "empty"}`} {...props} />;
}

function ImageFrame({
  shape = "rounded",
  radius = 12,
  placeholder = "Drop an image",
  src,
  logo,
  alt,
  className,
  style,
}: ImageSlotProps) {
  const { ref, loaded, failed, natRatio, onReady, onError } = useImageState();
  let borderRadius = `${radius}px`;
  if (shape === "circle") borderRadius = "50%";
  else if (shape === "pill") borderRadius = "9999px";
  else if (shape === "rect") borderRadius = "0";

  // Branded fallback: no real campaign photo has loaded but a brand logo exists.
  // Show a tasteful dark card with the logo fully contained (never cropped)
  // instead of the unfinished "Drop … image" placeholder.
  const showLogoCard = !loaded && !!logo;

  return (
    <div
      // Keep the designed fixed ratio for the branded logo card (skip ph-img's
      // 4/3). For a real photo the frame takes the image's TRUE aspect ratio so
      // it fills edge-to-edge with NO cropping; before that the style hint reserves space.
      className={cn("img-slot", !loaded && !showLogoCard && "ph-img", className)}
      style={{ borderRadius, ...style, ...(natRatio ? { aspectRatio: natRatio } : null) }}
      aria-label={alt || placeholder}
    >
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          className="photo-slot-img"
          src={src}
          alt={alt || placeholder}
          width={1000}
          height={1000}
          loading="lazy"
          decoding="async"
          draggable={false}
          data-loaded={loaded ? "true" : "false"}
          onLoad={(e) => onReady(e.currentTarget)}
          onError={onError}
        />
      )}
      {showLogoCard ? (
        <span
          // Dark card with a subtle APAR-red radial glow behind a centered,
          // fully-contained logo. Uses the same shared frame geometry as PhotoSlot.
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16%",
            background:
              "radial-gradient(120% 100% at 50% 42%, rgba(235,59,37,.22), rgba(196,42,23,.06) 46%, transparent 72%), var(--ink)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt={alt ? `${alt} logo` : placeholder}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </span>
      ) : (
        !loaded && <span className="img-slot-cap">{placeholder}</span>
      )}
    </div>
  );
}
