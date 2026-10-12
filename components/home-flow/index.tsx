"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "../reveal";
import { PhotoSlot } from "../photo-slot";
import { useFeaturedHover } from "./use-featured-hover";
import { FEATURED_CLIENTS } from "@/lib/cases";

export function ProgressiveQuote({ id, label, text, explanation, dark = false }: {
  id: string; label: string; text: string; explanation: string; dark?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const cinematic = id === "studio";
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      if (cinematic && root.current) {
        const el = root.current;
        const timeline = gsap.timeline({ scrollTrigger: {
          trigger: el, start: "top 65%", end: "bottom 90%", scrub: 0.65,
          invalidateOnRefresh: true,
        }});
        timeline.fromTo(el.querySelectorAll(".pq-letter"),
          { yPercent: 115, rotateX: -70, opacity: 0 },
          { yPercent: 0, rotateX: 0, opacity: 1, stagger: 0.025, duration: 0.85, ease: "power3.out" }, 0)
          .fromTo(el.querySelectorAll(".pq-boundary"), { scaleY: 0.25, opacity: 0 },
            { scaleY: 1, opacity: 1, duration: 0.6 }, 0.2)
          .to(el.querySelector(".pq-boundary-left"), { xPercent: -160, opacity: 0, duration: 1 }, 0.8)
          .to(el.querySelector(".pq-boundary-right"), { xPercent: 160, opacity: 0, duration: 1 }, 0.8)
          .fromTo(el.querySelector(".pq-limitless"), { scale: 0.9 },
            { scale: 1, duration: 1.1, ease: "power2.inOut" }, 0.4)
          .fromTo(el.querySelectorAll(".pq-beyond-word"), { yPercent: 110, rotate: 5, opacity: 0 },
            { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.15, duration: 1, ease: "power3.out" }, 0.65)
          .fromTo(el.querySelector(".pq-stroke"), { scaleX: 0 },
            { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 1.35)
          .fromTo(el.querySelector(".pq-explanation"), { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 }, 1.55);
        return;
      }
      const words = root.current?.querySelectorAll(".pq-word");
      if (!words) return;
      gsap.fromTo(words, { opacity: 0.18 }, {
        opacity: 1, stagger: 0.3, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top 45%", end: "bottom 75%", scrub: 0.3 },
      });
    }, root);
    return () => media.revert();
  }, [cinematic]);
  return <section ref={root} id={id} className={`progressive-quote${cinematic ? " is-cinematic" : ""}${dark ? " is-dark" : ""}`} aria-labelledby={`${id}-quote`}>
    <div className="pq-sticky wrap">
      <span className="flow-kicker">{label}</span>
      {cinematic ? <h2 id={`${id}-quote`} aria-label={text}>
        <span className="pq-limitless" aria-hidden="true">
          <i className="pq-boundary pq-boundary-left" />
          <span className="pq-letter-mask">{"Limitless.".split("").map((letter, i) => <span className="pq-letter" key={i}>{letter}</span>)}</span>
          <i className="pq-boundary pq-boundary-right" />
        </span>
        <span className="pq-beyond" aria-hidden="true"><span className="pq-word-mask"><span className="pq-beyond-word">Beyond</span></span>{" "}<span className="pq-word-mask"><span className="pq-beyond-word">Culture.</span></span><i className="pq-stroke" /></span>
      </h2> : <h2 id={`${id}-quote`} aria-label={text}>{text.split(" ").map((word, i) => <span className="pq-word" aria-hidden="true" key={i}>{word}{" "}</span>)}</h2>}
      <p className="pq-explanation">{explanation}</p>
      <span className="pq-cue" aria-hidden="true">Scroll to discover <span>↓</span></span>
    </div>
  </section>;
}

const SELECTED = [
  {
    "slug": "chheda",
    "src": "/work/featured/chheda-banner.webp",
    "title": "Chheda Jewellers",
    "type": "Campaign direction",
    "ratio": "1920/1080"
  },
  {
    "slug": "chheda",
    "src": "/work/featured/chheda-heritage.webp",
    "title": "Chheda Jewellers",
    "type": "Heritage collection",
    "ratio": "2000/1334"
  },
  {
    "slug": "achal",
    "src": "/work/featured/achal-one-signage.webp",
    "title": "Achal One",
    "type": "Brand identity",
    "ratio": "2000/1200"
  },
  {
    "slug": "chheda",
    "src": "/work/featured/chheda-classic.webp",
    "title": "Chheda Jewellers",
    "type": "Collection campaign",
    "ratio": "1996/1400"
  },
  {
    "slug": "a-paramount",
    "src": "/work/featured/paramount-ceiling.webp",
    "title": "A Paramount",
    "type": "Architectural craft",
    "ratio": "1875/1400"
  },
  {
    "slug": "maison-mireyaa",
    "src": "/work/featured/mireyaa-botanical.webp",
    "title": "Maison Mireyaa",
    "type": "Botanical identity",
    "ratio": "1980/1400"
  },
  {
    "slug": "chheda",
    "src": "/work/featured/chheda-diamond.webp",
    "title": "Chheda Jewellers",
    "type": "Diamond collection",
    "ratio": "2000/1334"
  },
  {
    "slug": "achal",
    "src": "/work/featured/achal-one-interior.webp",
    "title": "Achal One",
    "type": "Identity in context",
    "ratio": "2000/1125"
  },
  {
    "slug": "chheda",
    "src": "/work/featured/chheda-bridal.webp",
    "title": "Chheda Jewellers",
    "type": "Bridal collection",
    "ratio": "2000/1334"
  },
  {
    "slug": "achal",
    "src": "/work/featured/achal-one-emblem.webp",
    "title": "Achal One",
    "type": "Brand system",
    "ratio": "2000/1200"
  },
  {
    "slug": "chheda",
    "src": "/work/featured/chheda-red.webp",
    "title": "Chheda Jewellers",
    "type": "Editorial campaign",
    "ratio": "2000/1334"
  },
  {
    "slug": "achal",
    "src": "/work/featured/achal-one-space.webp",
    "title": "Achal One",
    "type": "Environmental branding",
    "ratio": "2000/1125"
  }
];
export function FeaturedProjects() {
  const grid = useRef<HTMLDivElement>(null);
  useFeaturedHover(grid);
  return <section id="featured-work" className="flow-featured flow-section"><div className="wrap">
    <div className="flow-heading"><Reveal as="h2">Featured Work</Reveal><p>A selection of brand identities, campaigns and digital experiences created for ambitious brands.</p></div>
    <div ref={grid} className="flow-project-grid">{SELECTED.map((project, i) => <Reveal as={Link} href={`/work/${project.slug}`} className="flow-project" key={project.src} i={i % 2}>
      <div className="flow-project-image"><PhotoSlot src={project.src} placeholder={`${project.title} — ${project.type}`} fixedRatio="20/13" radius={15} style={{ width: "100%" }} /></div>
      <div className="flow-project-caption"><span>{project.type}</span>
        <h3 aria-label={project.title}><i className="flow-project-arrow" aria-hidden="true">→</i>
          <span aria-hidden="true">{project.title.split(" ").map((word, wi) => <span key={wi} className="flow-title-word">{[...word].map((letter, li) => <span className="flow-letter-window" key={li}><span className="flow-letter-stack"><span>{letter}</span><span>{letter}</span></span></span>)}{wi < project.title.split(" ").length - 1 ? " " : ""}</span>)}</span>
        </h3>
      </div>
    </Reveal>)}</div>
    <div className="flow-project-end"><Link className="btn ink" href="/clients"><span>See all projects</span><span className="arr" aria-hidden="true">↗</span></Link></div>
  </div></section>;
}

export function MovingClients() {
  const [paused, setPaused] = useState(false);
  const rows = [FEATURED_CLIENTS.slice(0, 4), FEATURED_CLIENTS.slice(4, 8), FEATURED_CLIENTS.slice(8, 12)];
  return <section id="clients" className="flow-clients flow-section" data-paused={paused} aria-labelledby="flow-clients-title">
    <div className="wrap flow-client-heading"><div><span className="flow-kicker">05 / In good company</span><h2 id="flow-clients-title">Brands we<br /> work with.</h2></div><div><p>Jewellery houses, lifestyle brands and ambitious businesses. Each with a world of its own.</p><button className="flow-motion-toggle" onClick={() => setPaused(p => !p)} aria-pressed={paused}>{paused ? "Resume logo motion" : "Pause logo motion"}</button></div></div>
    <div className="flow-logo-rows">{rows.map((row, i) => <div className="flow-logo-window" key={i}><div className={`flow-logo-track row-${i}`}>
      {[0, 1, 2].map(copy => <div className="flow-logo-group" key={copy} aria-hidden={copy ? true : undefined}>{row.map(client => <Link href={client.href} tabIndex={copy ? -1 : undefined} aria-label={client.name} key={client.slug}>
        {/* Client-owned logo assets; duplicate groups are decorative. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={client.logo} alt={client.name} width={200} height={110} loading="lazy" />
      </Link>)}</div>)}
    </div></div>)}</div>
  </section>;
}
