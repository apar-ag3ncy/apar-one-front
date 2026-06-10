"use client";

import { useEffect, useRef, useState } from "react";

// "A" / leading-vowel glyphs across writing systems — only this letter morphs.
const A_GLYPHS = [
  "A", // Latin
  "अ", // Devanagari
  "Α", // Greek (Alpha)
  "А", // Cyrillic
  "ا", // Arabic (alif)
  "א", // Hebrew (aleph)
  "ア", // Japanese (katakana a)
  "あ", // Japanese (hiragana a)
  "아", // Korean (a)
  "அ", // Tamil
  "অ", // Bengali
  "Ա", // Armenian
  "ა", // Georgian
  "อ", // Thai
];

/**
 * Animated APAR wordmark — the leading "A" cycles through the same vowel in
 * many scripts. Fast flurry on first page open, then a calm slow cycle while
 * exploring (the component stays mounted across client-side navigations).
 * Respects prefers-reduced-motion (stays on Latin "A").
 */
export function AparLogo({ onDark = false }: { onDark?: boolean }) {
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const start = Date.now();
    let idx = 0;
    const tick = () => {
      idx = (idx + 1) % A_GLYPHS.length;
      setI(idx);
      const elapsed = Date.now() - start;
      // fast on open (~1.8s flurry), then slow/calm at ~0.75 of a beat
      const delay = elapsed < 1800 ? 80 : 1300;
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, 80);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <span className={`apar-logo${onDark ? " on-dark" : ""}`} aria-label="APAR" role="img">
      <span className="apar-a" key={i} aria-hidden="true">
        {A_GLYPHS[i]}
      </span>
      <span className="apar-rest" aria-hidden="true">
        PAR
      </span>
    </span>
  );
}
