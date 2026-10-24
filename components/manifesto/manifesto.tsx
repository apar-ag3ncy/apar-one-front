"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HoverText } from "@/components/motion/hover-text";
import { ManifestoSculpture } from "@/components/manifesto/manifesto-sculpture";

const BELIEFS = [
  { word: "Meaning", title: <>Find the <em>real thing.</em></>,
    text: "Before the colour. Before the campaign. Before the noise. We look for what makes a brand itself — the people, the purpose, the point of view.",
    note: "A clear idea is where everything begins." },
  { word: "Identity", title: <>Make every part <em>belong.</em></>,
    text: "An identity is more than a mark. It is a language. Images, words, colour and rhythm, working together so the brand feels like itself wherever it shows up.",
    note: "Many expressions. One unmistakable world." },
  { word: "Experience", title: <>Give people <em>a feeling.</em></>,
    text: "A story becomes stronger when people can step inside it. Every image, every movement, every interaction is a chance to make your brand felt.",
    note: "From something you see to something you remember." },
];

// One deterministic composition, three states. No image downloads, render loop
// or random SSR values: the same 81 tiles move from a seed to a system to a world.
const TILES = Array.from({ length: 81 }, (_, i) => {
  const col = i % 9 - 4, row = Math.floor(i / 9) - 4;
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  const distance = 38 + Math.sqrt(i / 80) * 160;
  return { gridX: col * 32, gridY: row * 32,
    seedX: col * 8, seedY: row * 8,
    worldX: Math.cos(angle) * distance, worldY: Math.sin(angle) * distance,
    opacity: Math.max(.24, 1 - Math.hypot(col, row) / 8) };
});

export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let alive = true;
    media.add({ cinematic: "(min-width: 900px) and (min-height: 650px)",
      motion: DESKTOP_MOTION_QUERY }, context => {
      if (!context.conditions?.motion) return;
      const track = el.querySelector<HTMLElement>(".manifesto-journey")!;
      const chapters = Array.from(el.querySelectorAll<HTMLElement>(".manifesto-chapter"));
      const tiles = Array.from(el.querySelectorAll<SVGRectElement>(".manifesto-tile"));
      if (!context.conditions?.cinematic) {
        // Phones keep natural page scrolling and all the copy in normal flow.
        chapters.forEach(chapter => gsap.fromTo(chapter, { y: 20 }, {
          y: 0, ease: "none", scrollTrigger: { trigger: chapter, start: "top 92%", end: "top 55%", scrub: .3 },
        }));
        gsap.to(".manifesto-orbit", { rotation: 35, ease: "none",
          scrollTrigger: { trigger: track, start: "top bottom", end: "top top", scrub: .5 } });
        return;
      }

      track.dataset.motion = "cinematic";
      const steps = Array.from(el.querySelectorAll<HTMLElement>(".manifesto-step"));
      const setStep = (progress: number) => {
        track.dataset.progress = progress.toFixed(3);
        const active = Math.min(2, Math.floor(progress * 3));
        steps.forEach((step, index) => { step.dataset.active = String(index === active); });
      };
      gsap.set(chapters.slice(1), { autoAlpha: 0, y: 36 });
      // The parent groups own the static grid positions. Animate offsets from
      // those positions so the no-JS artwork and every motion state coincide.
      gsap.set(tiles, { x: i => TILES[i].seedX - TILES[i].gridX, y: i => TILES[i].seedY - TILES[i].gridY, scale: .42 });
      const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" },
        scrollTrigger: { id: "apar-manifesto", trigger: track, start: "top 84px", end: "bottom bottom",
          scrub: .55, invalidateOnRefresh: true, onUpdate: self => setStep(self.progress), onRefresh: self => setStep(self.progress) },
      });
      timeline.to(tiles, { x: 0, y: 0, scale: 1, duration: .9, stagger: { amount: .14, from: "center" } }, 0)
        .to(".manifesto-orbit-inner", { attr: { transform: "rotate(45)" }, duration: 1.05 }, 0)
        .to(chapters[0], { autoAlpha: 0, y: -28, duration: .18 }, .9)
        .to(chapters[1], { autoAlpha: 1, y: 0, duration: .22 }, 1.02)
        .to(".manifesto-grid-lines", { opacity: .7, duration: .4 }, 1.02)
        .to(tiles, { x: i => TILES[i].worldX - TILES[i].gridX, y: i => TILES[i].worldY - TILES[i].gridY, rotation: i => i * 7,
          scale: i => .55 + (i % 4) * .12, duration: .95, stagger: { amount: .12, from: "center" } }, 1.8)
        .to(".manifesto-grid-lines", { opacity: 0, duration: .4 }, 1.8)
        .to(".manifesto-orbit-inner", { attr: { transform: "rotate(90)" }, duration: .95 }, 1.8)
        .to(chapters[1], { autoAlpha: 0, y: -28, duration: .18 }, 1.9)
        .to(chapters[2], { autoAlpha: 1, y: 0, duration: .22 }, 2.02)
        .to(".manifesto-meter-fill", { scaleX: 1, duration: 3, ease: "none" }, 0);
      setStep(timeline.scrollTrigger?.progress ?? 0);
      return () => {
        delete track.dataset.motion; delete track.dataset.progress;
        steps.forEach(step => { delete step.dataset.active; });
      };
    }, root);
    const refresh = () => { if (alive) ScrollTrigger.refresh(); };
    document.fonts.ready.then(refresh).catch(() => {});
    return () => { alive = false; media.revert(); };
  }, []);

  return <main ref={root} className="manifesto-page">
    <header className="manifesto-opening wrap">
      <div className="manifesto-meta"><span>APĀR / Manifesto</span><span>A point of view, not a rulebook.</span></div>
      <h1>Limitless.<br /><em>Beyond Culture.</em></h1>
      <div className="manifesto-opening-bottom">
        <p>Rooted in who you are.<br />Open to what you can become.</p>
        <a href="#our-beliefs" className="manifesto-scroll">Explore our thinking <span aria-hidden="true">↘</span></a>
      </div>
    </header>

    <section className="manifesto-journey" id="our-beliefs" aria-label="The APĀR point of view">
      <div className="manifesto-stage wrap">
        <div className="manifesto-journey-top"><span>From one idea to a brand world.</span><span className="manifesto-scroll-note">Scroll to unfold ↓</span></div>
        <div className="manifesto-stage-body">
          <div className="manifesto-chapters">
            {BELIEFS.map((belief, i) => <article className="manifesto-chapter" key={belief.word}>
              <span className="manifesto-kicker">0{i + 1} / {belief.word}</span>
              <h2>{belief.title}</h2><p>{belief.text}</p><small>{belief.note}</small>
            </article>)}
          </div>
          <div className="manifesto-art" aria-hidden="true">
            <svg className="manifesto-orbit" viewBox="-240 -240 480 480" fill="none">
              <circle className="manifesto-orbit-outer" r="218" stroke="currentColor" strokeWidth=".6" />
              <g className="manifesto-orbit-inner"><rect x="-156" y="-156" width="312" height="312" rx="3" stroke="currentColor" strokeWidth=".7" /></g>
              <g className="manifesto-grid-lines" opacity="0">{[-128, -64, 0, 64, 128].map(n => <g key={n}><path d={`M ${n} -170 V 170 M -170 ${n} H 170`} stroke="currentColor" strokeWidth=".4" /></g>)}</g>
              <g>{TILES.map((tile, i) => <g key={i} transform={`translate(${tile.gridX} ${tile.gridY})`}><rect className="manifesto-tile" x={-9} y={-9} width="18" height="18" rx="3" fill="#F73923" opacity={tile.opacity} style={{ transformOrigin: "0px 0px" }} /></g>)}</g>
              <path d="M-228 0h20M208 0h20M0-228v20M0 208v20" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="manifesto-art-label">An idea. A system. A feeling.</span>
          </div>
        </div>
        <div className="manifesto-journey-bottom"><div className="manifesto-steps">{BELIEFS.map((belief, i) => <span className="manifesto-step" key={belief.word}>0{i + 1} <span>{belief.word}</span></span>)}</div><div className="manifesto-meter" aria-hidden="true"><i className="manifesto-meter-fill" /></div></div>
      </div>
    </section>

    <ManifestoSculpture />

    <section className="manifesto-closing wrap">
      <span className="manifesto-kicker">This is what we believe.</span>
      <h2>We don’t just<br />build brands.<br /><em>We build the way<br />they’re experienced.</em></h2>
      <div className="manifesto-closing-bottom"><p>Strategy gives it direction.<br />Design gives it character.<br />Interaction makes it felt.</p><Link className="btn" href="/work"><HoverText>See it in our work</HoverText><span className="arr" aria-hidden="true">↗</span></Link></div>
    </section>
  </main>;
}
