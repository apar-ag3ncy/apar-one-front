"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

export function ProgressiveQuote({ id, text, dark = false }: {
  id: string; text: string; dark?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const cinematic = id === "studio";

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      const section = root.current;
      if (!section) return;

      if (cinematic) {
        // Follow normal document flow with one scroll clock and two transforms.
        // No pin or sticky hold, so changing direction has no release point.
        gsap.timeline({
          defaults: { duration: 1, ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "clamp(top bottom)",
            end: "clamp(bottom top)",
            scrub: true,
          },
        })
          .fromTo(".pq-landscape", { yPercent: -4, scale: 1.08 }, { yPercent: 4, scale: 1.02 }, 0)
          .fromTo(".pq-copy", { y: 24 }, { y: -20 }, 0);
        return;
      }

      gsap.fromTo(section.querySelectorAll(".pq-word"), { opacity: 0.18 }, {
        opacity: 1, stagger: 0.3, ease: "none",
        scrollTrigger: { trigger: section, start: "top 45%", end: "bottom 75%", scrub: 0.3 },
      });
    }, root);
    return () => media.revert();
  }, [cinematic]);

  const copy = <div className="pq-sticky wrap">
    <h2 id={`${id}-quote`} className="pq-copy" aria-label={text}>
      {cinematic ? <>
        <span className="pq-limitless" aria-hidden="true">Limitless.</span>{" "}
        <span className="pq-beyond" aria-hidden="true">Beyond Culture.</span>
      </> : text.split(" ").map((word, i) => <span className="pq-word" aria-hidden="true" key={i}>{word}{" "}</span>)}
    </h2>
  </div>;

  return <section ref={root} id={id}
    className={`progressive-quote${cinematic ? " is-cinematic" : ""}${dark ? " is-dark" : ""}`}
    aria-labelledby={`${id}-quote`}>
    {cinematic ? <div className="pq-scene">
      <div className="pq-landscape" aria-hidden="true">
        {/* Local responsive artwork; no video, canvas or new rendering loop. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/studio/limitless-1536.webp"
          srcSet="/images/studio/limitless-640.webp 640w, /images/studio/limitless-960.webp 960w, /images/studio/limitless-1536.webp 1536w"
          sizes="(max-width: 900px) 150vw, 100vw"
          width="1536" height="1024" alt="" loading="lazy" decoding="async" />
      </div>
      {copy}
    </div> : copy}
  </section>;
}
