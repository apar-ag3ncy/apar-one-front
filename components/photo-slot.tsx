"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useImagePixelTrail } from "./use-image-pixel-trail";
import type { CSSProperties } from "react";

interface PhotoSlotProps {
  /** Image file, e.g. /work/<slug>/1.jpg. Omit when the file doesn't exist yet
   *  to show the fallback without firing a 404. */
  src?: string;
  /** Responsive variants for cards that render much smaller than the source. */
  srcSet?: string;
  sizes?: string;
  /** Accessible name for the frame (also the alt of the photo). Never rendered
   *  as visible copy when a `logo` fallback is given. */
  placeholder?: string;
  radius?: number;
  /** Aspect-ratio hint (e.g. "4/5") used before the image loads, to reserve the
   *  right cell shape and avoid layout shift. Once loaded, the image's true
   *  natural ratio takes over. */
  ratio?: string;
  /** Uniform catalogue frame; natural image ratio remains the default elsewhere. */
  fixedRatio?: string;
  /** Brand logo (e.g. /logos/<slug>.png). With no photo, the frame renders a
   *  finished branded card - the logo centred on a panel in the page's own
   *  colours (`.case-ph`) - instead of a drop-zone note. Same flags as the
   *  featured cards: `logoTint` masks the logo to a solid colour, `logoInvert`
   *  renders it as a white silhouette. */
  logo?: string;
  logoTint?: string;
  logoInvert?: boolean;
  /** Only paints the identity fallback; the loaded photograph is untouched. */
  logoSurface?: string;
  /** Small label on the branded card (e.g. the gallery facet "Editorial
   *  campaign"). Only given where the copy is meant for visitors. */
  caption?: string;
  /** Above-the-fold frame (the case hero): fetch the photo eagerly and at high
   *  priority instead of lazily, so the largest paint isn't deferred. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

function dimensionsFromRatio(value?: string) {
  if (!value) return { width: 1000, height: 1000 };
  const [numerator, denominator = 1] = value.split("/").map(Number);
  const ratio = numerator / denominator;
  return Number.isFinite(ratio) && ratio > 0
    ? { width: Math.round(1000 * ratio), height: 1000 }
    : { width: 1000, height: 1000 };
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
export function PhotoSlot(props: PhotoSlotProps) {
  // A replacement asset starts with its own load/error state, natural ratio and
  // sampled pixel canvas. Keep priority updates on the same mounted image.
  return <PhotoFrame key={props.src ?? `identity:${props.logo ?? "empty"}`} {...props} />;
}

function PhotoFrame({
  src,
  srcSet,
  sizes,
  placeholder = "Drop an image",
  radius = 12,
  ratio,
  fixedRatio,
  logo,
  logoTint,
  logoInvert,
  logoSurface,
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
  const aspectRatio = fixedRatio ?? natRatio ?? ratio;
  const dimensions = dimensionsFromRatio(fixedRatio ?? ratio);
  const showLogoCard = (!loaded || failed) && !!logo;

  return (
    <div
      className={cn("img-slot", (!loaded || failed) && "ph-img", showLogoCard && "has-brand", className)}
      style={{ borderRadius: `${radius}px`, ...style, ...(aspectRatio ? { aspectRatio } : null),
        ...(showLogoCard && logoSurface ? { background: logoSurface } : null) }}
      aria-label={showLogoCard ? placeholder : undefined}
      role={showLogoCard ? "img" : undefined}
      data-logo-surface={showLogoCard && logoSurface ? "brand" : undefined}
    >
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          className="photo-slot-img"
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={placeholder}
          width={dimensions.width}
          height={dimensions.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          draggable={false}
          data-loaded={loaded ? "true" : "false"}
          onLoad={(e) => onReady(e.currentTarget)}
          onError={() => { setFailed(true); setLoaded(false); }}
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
            <img className={cn("case-ph-logo", logoInvert && "case-ph-logo--invert")} src={logo} alt="" width={400} height={400} loading="lazy" decoding="async" />
          )}
          {caption && <span className="case-ph-cap">{caption}</span>}
        </span>
      ) : (
        !loaded && <span className="img-slot-cap">{placeholder}</span>
      )}
    </div>
  );
}
