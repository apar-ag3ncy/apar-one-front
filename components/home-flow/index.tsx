"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "../reveal";
import { PhotoSlot } from "../photo-slot";
import { useFeaturedHover } from "./use-featured-hover";
import { FEATURED_CLIENTS } from "@/lib/cases";
import { HoverText } from "../hover-text";

export function ProgressiveQuote({ id, text, dark = false }: {
  id: string; text: string; dark?: boolean;
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
            { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 1.35);
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
      {cinematic ? <h2 id={`${id}-quote`} aria-label={text}>
        <span className="pq-limitless" aria-hidden="true">
          <i className="pq-boundary pq-boundary-left" />
          <span className="pq-letter-mask">{"Limitless.".split("").map((letter, i) => <span className="pq-letter" key={i}>{letter}</span>)}</span>
          <i className="pq-boundary pq-boundary-right" />
        </span>
        <span className="pq-beyond" aria-hidden="true"><span className="pq-word-mask"><span className="pq-beyond-word">Beyond</span></span>{" "}<span className="pq-word-mask"><span className="pq-beyond-word">Culture.</span></span><i className="pq-stroke" /></span>
      </h2> : <h2 id={`${id}-quote`} aria-label={text}>{text.split(" ").map((word, i) => <span className="pq-word" aria-hidden="true" key={i}>{word}{" "}</span>)}</h2>}
    </div>
  </section>;
}

const SELECTED = [
  {
    "slug": "signi",
    "src": "/work/signi/hero.webp",
    "width": 1400,
    "title": "Signi",
    "type": "Lab-grown jewellery campaign",
    "ratio": "1400/1750"
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
    "slug": "high-on-smiles",
    "src": "/work/featured/high-on-smiles.webp",
    "title": "High on Smiles",
    "type": "Clinic identity",
    "ratio": "20/13"
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
    "slug": "kundan-jewellers",
    "src": "/work/featured/kundan-jewellers.webp",
    "title": "Kundan Jewellers",
    "type": "Gold collection",
    "ratio": "20/13"
  },
  {
    "slug": "girvaan",
    "src": "/work/featured/girvaan-storefront.webp",
    "title": "Girvaan",
    "type": "Jewellery brand world",
    "ratio": "20/13"
  }
];
export function FeaturedProjects() {
  const grid = useRef<HTMLDivElement>(null);
  useFeaturedHover(grid);
  return <section id="featured-work" className="flow-featured flow-section"><div className="wrap">
    <div className="flow-heading"><Reveal as="h2">Featured Work</Reveal></div>
    <div ref={grid} className="flow-project-grid">{SELECTED.map((project, i) => <Reveal as={Link} href={`/work/${project.slug}`} className="flow-project" key={project.src} i={i % 2}>
      <div className="flow-project-image"><PhotoSlot src={project.src}
        srcSet={`${project.src.replace(/\.webp$/, "-480.webp")} 480w, ${project.src.replace(/\.webp$/, "-960.webp")} 960w, ${project.src} ${"width" in project ? project.width : 1600}w`}
        sizes="(max-width: 800px) 48vw, 44vw"
        placeholder={`${project.title} — ${project.type}`} fixedRatio="20/13" radius={15} style={{ width: "100%" }} />
        {project.slug === "girvaan" && <span className="girvaan-store-sign" aria-hidden="true">
          {/* The original client wordmark sits on the blank photographed fascia. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/girvaan.png" alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        </span>}</div>
      <div className="flow-project-caption"><span>{project.type}</span>
        <h3 aria-label={project.title}><i className="flow-project-arrow" aria-hidden="true">→</i>
          <span aria-hidden="true">{project.title.split(" ").map((word, wi) => <span key={wi} className="flow-title-word">{[...word].map((letter, li) => <span className="flow-letter-window" key={li}><span className="flow-letter-stack"><span>{letter}</span><span>{letter}</span></span></span>)}{wi < project.title.split(" ").length - 1 ? " " : ""}</span>)}</span>
        </h3>
      </div>
    </Reveal>)}</div>
    <div className="flow-project-end"><Link className="btn ink" href="/clients"><HoverText>See all projects</HoverText><span className="arr" aria-hidden="true">↗</span></Link></div>
  </div></section>;
}

export function MovingClients() {
  const rows = [FEATURED_CLIENTS.slice(0, 4), FEATURED_CLIENTS.slice(4, 8), FEATURED_CLIENTS.slice(8, 12)];
  return <section id="clients" className="flow-clients flow-section" aria-labelledby="flow-clients-title">
    <div className="wrap flow-client-heading"><div><h2 id="flow-clients-title">Recommended<br /> by the best.</h2></div></div>
    <div className="flow-logo-rows">{rows.map((row, i) => <div className="flow-logo-window" key={i}><div className={`flow-logo-track row-${i}`}>
      {[0, 1, 2].map(copy => <div className="flow-logo-group" key={copy} aria-hidden={copy ? true : undefined}>{row.map(client => <Link href={client.href} tabIndex={copy ? -1 : undefined} aria-label={client.name} key={client.slug}>
        {/* Client-owned logo assets; duplicate groups are decorative. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={client.logo} alt={client.name} width={200} height={110} loading="lazy" />
      </Link>)}</div>)}
    </div></div>)}</div>
  </section>;
}
