"use client";

import { useEffect, useRef, useState } from "react";
import { useImagePixelTrail } from "./use-image-pixel-trail";

/** Shared image readiness for both frame styles. The owning frame is keyed by
 * its source, so replacements receive fresh load, error and sampling state. */
export function useImageState() {
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
  const onError = () => { setFailed(true); setLoaded(false); };

  // An image may already be in the cache before React attaches onLoad.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete) {
      if (img.naturalWidth > 0) onReady(img);
      else onError();
    }
  }, []);

  return { ref, loaded, failed, natRatio, onReady, onError };
}
