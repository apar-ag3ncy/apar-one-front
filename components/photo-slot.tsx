"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useImagePixelTrail } from "./use-image-pixel-trail";
import type { CSSProperties } from "react";

interface PhotoSlotProps {
  /** Image file, e.g. /work/<slug>/1.jpg. Omit when the file doesn't exist yet
   *  to show the fallback without firing a 404. */
  src?: string;
  /** Accessible name for the frame (also the alt of the photo). Never rendered
   *  as visible copy when a `logo` fallback is given. */
  placeholder?: string;
  radius?: number;
  /** Aspect-ratio hint (e.g. "4/5") used before the image loads, to reserve the
   *  right cell shape and avoid layout shift. Once loaded, the image's true
   *  natural ratio takes over. */
  ratio?: string;
  /** Brand logo (e.g. /logos/<slug>.png). With no photo, the frame renders a
   *  finished branded card - the logo centred on a panel in the page's own
   *  colours (`.case-ph`) - instead of a drop-zone note. Same flags as the
   *  featured cards: `logoTint` masks the logo to a solid colour, `logoInvert`
   *  renders it as a white silhouette. */
  logo?: string;
  logoTint?: string;
  logoInvert?: boolean;
  /** Small label on the branded card (e.g. the gallery facet "Editorial
   *  campaign"). Only given where the copy is meant for visitors. */
  caption?: string;
  /** Above-the-fold frame (the case hero): fetch the photo eagerly and at high
   *  priority instead of lazily, so the largest paint isn't deferred. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Project image frame. Shows the photo at `src`; until a file exists there it
 * shows the branded logo card (when a `logo` is given) or the editorial
 * drop-zone placeholder - so dropping the file into /public/work/<slug>/ is all
 * that's needed (mirrors the logo/video pattern).
 *
 * The frame sizes itself to the photo's TRUE aspect ratio (natural once loaded,
 * the `ratio` hint before that), so the image fills it edge-to-edge with NO
 * cropping - whatever shape the photo is, the grid cell matches it. This
 * overrides the gallery's default fixed cell ratio.
 */
export function PhotoSlot({
  src,
  placeholder = "Drop an image",
  radius = 12,
  ratio,
  logo,
  logoTint,
  logoInvert,
  caption,
  priority = false,
  className,
  style,
}: PhotoSlotProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [natRatio, setNatRatio] = useState<string>();
  useImagePixelTrail(ref, loaded && !failed);

  const onReady = (img: HTMLImageElement) => {
    setLoaded(true);
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNatRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };

  // Cached images can finish before React attaches onLoad - check on mount too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) {
      if (img.naturalWidth > 0) onReady(img);
      else setFailed(true);
    }
  }, []);

  // Natural ratio wins once known; fall back to the hint; otherwise leave the
  // cell's CSS default (keeps the placeholder shape when there's no image).
  const aspectRatio = natRatio ?? ratio;
  const showLogoCard = !loaded && !!logo;

  return (
    <div
      className={cn("img-slot", !loaded && "ph-img", showLogoCard && "has-brand", className)}
      style={{ borderRadius: `${radius}px`, ...style, ...(aspectRatio ? { aspectRatio } : null) }}
      aria-label={showLogoCard ? placeholder : undefined}
      role={showLogoCard ? "img" : undefined}
    >
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          className="photo-slot-img"
          src={src}
          alt={placeholder}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          draggable={false}
          data-loaded={loaded ? "true" : "false"}
          onLoad={(e) => onReady(e.currentTarget)}
          onError={() => setFailed(true)}
        />
      )}
      {showLogoCard ? (
        <span className="case-ph" aria-hidden="true">
          {logoTint ? (
            <span
              className="case-ph-mask"
              style={{
                WebkitMaskImage: `url("${logo}")`,
                maskImage: `url("${logo}")`,
                backgroundColor: logoTint,
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={cn("case-ph-logo", logoInvert && "case-ph-logo--invert")} src={logo} alt="" loading="lazy" decoding="async" />
          )}
          {caption && <span className="case-ph-cap">{caption}</span>}
        </span>
      ) : (
        !loaded && <span className="img-slot-cap">{placeholder}</span>
      )}
    </div>
  );
}
