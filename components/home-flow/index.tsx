"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "../reveal";
import { PhotoSlot } from "../photo-slot";
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
  { slug: "chheda", src: "/work/chheda/hero.jpg", title: "Chheda Jewellers", type: "Identity · Campaigns", ratio: "9/16" },
  { slug: "girvaan", src: "/work/girvaan/hero.jpg", title: "Girvaan", type: "Art direction · Brand storytelling", ratio: "9/16" },
  { slug: "maison-mireyaa", src: "/work/maison-mireyaa/hero.jpg", title: "Maison Mireyaa", type: "Branding · Content", ratio: "4/5" },
  { slug: "signi", src: "/work/signi/3.jpg", title: "Signi", type: "Product imagery · Campaigns", ratio: "4/5" },
  { slug: "chheda", src: "/work/chheda/1.jpg", title: "Chheda Jewellers", type: "Campaign detail", ratio: "9/16" },
  { slug: "girvaan", src: "/work/girvaan/1.jpg", title: "Girvaan", type: "Campaign detail", ratio: "9/16" },
  { slug: "maison-mireyaa", src: "/work/maison-mireyaa/1.jpg", title: "Maison Mireyaa", type: "Floral storytelling", ratio: "4/5" },
  { slug: "achal", src: "/work/achal/1.jpg", title: "Achal", type: "Real estate · Campaigns", ratio: "4/5" },
  { slug: "signi", src: "/work/signi/1.jpg", title: "Signi", type: "Product imagery", ratio: "4/5" },
  { slug: "chheda", src: "/work/chheda/2.jpg", title: "Chheda Jewellers", type: "Festive creative", ratio: "9/16" },
  { slug: "girvaan", src: "/work/girvaan/2.jpg", title: "Girvaan", type: "Brand storytelling", ratio: "9/16" },
  { slug: "maison-mireyaa", src: "/work/maison-mireyaa/3.jpg", title: "Maison Mireyaa", type: "Editorial content", ratio: "4/5" },
];
export function FeaturedProjects() {
  return <section id="featured-work" className="flow-featured flow-section"><div className="wrap">
    <div className="flow-heading"><div><span className="flow-kicker">02 / Featured work</span><Reveal as="h2">Different worlds.<br /><em>One considered approach.</em></Reveal></div><p>A closer look at our brands, campaigns and creative details. Strategy and craft, made visible.</p></div>
    <div className="flow-project-grid">{SELECTED.map((project, i) => <Reveal as={Link} href={`/work/${project.slug}`} className="flow-project" style={{ maxWidth: project.ratio === "9/16" ? 247.5 : 352 }} key={project.src} i={i % 2}>
      <div className="flow-project-image"><PhotoSlot src={project.src} placeholder={`${project.title} campaign`} ratio={project.ratio} radius={0} style={{ width: "100%" }} /></div>
      <div className="flow-project-caption"><h3>{project.title}</h3><span>{project.type}</span><i className="flow-project-arrow" aria-hidden="true">↗</i></div>
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
