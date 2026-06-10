"use client";

import { useState } from "react";
import { Intro } from "@/components/intro";
import { Hero } from "@/components/hero";
import { BrandBand } from "@/components/brand-band";
import { VelocityMarquee } from "@/components/velocity-marquee";
import { SplitWords } from "@/components/split-words";
import { ScrollFill } from "@/components/scroll-fill";
import { PinnedGallery } from "@/components/pinned-gallery";
import { Faq } from "@/components/faq";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { ImageSlot } from "@/components/image-slot";
import { FEATURED_CLIENTS } from "@/lib/cases";
import { FeaturedCard } from "@/components/featured-card";
import { RippleCanvas } from "@/components/ripple-canvas";

const SERVICES = [
  { num: "01", name: "Branding", desc: "Identity, positioning & brand systems that hold up everywhere." },
  { num: "02", name: "Digital Marketing", desc: "Performance, social & growth — measured, not guessed." },
  { num: "03", name: "AI Content Creation", desc: "Studio-grade visuals & copy, produced at the speed of culture." },
  { num: "04", name: "Strategy & Campaigns", desc: "Big ideas with a plan — from concept to launch." },
];

const PROCESS = [
  { n: "01", h: "Immerse", p: "We dig into your brand, market and customer until we know what only an insider would." },
  { n: "02", h: "Strategy", p: "A sharp point of view and a plan — positioning, message and route to market." },
  { n: "03", h: "Create", p: "Identity, content and campaigns crafted by hand and accelerated with AI." },
  { n: "04", h: "Launch & grow", p: "We ship, measure and optimise — turning attention into repeatable results." },
];

const WALL = [
  "Harshit Gold",
];

export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      <Intro onDone={() => setIntroDone(true)} />

      <Hero start={introDone} />

      <BrandBand />

      <VelocityMarquee />

      {/* ===== STICKY EDITORIAL SPLIT ===== */}
      <section className="section split-sec" id="studio" data-screen-label="Home — Approach">
        <div className="wrap">
          <div className="tag-line">
            <span>01 — Who we are</span>
            <i className="ln" />
          </div>
          <div className="split-grid" style={{ marginTop: 48 }}>
            <div className="split-sticky">
              <SplitWords
                as="h2"
                className="display d-md"
                text="Where strategy meets craft — and brands become impossible to ignore."
              />
              <Reveal as="p" className="lead" style={{ marginTop: 28 }}>
                We go deep, not wide. A short client list in jewellery and real estate means every
                brand gets obsessive attention — from the first idea to the last pixel.
              </Reveal>
              <Reveal style={{ marginTop: 32 }}>
                <a className="btn ink" href="#studio">
                  <span>Inside the studio</span>
                  <span className="arr">↗</span>
                </a>
              </Reveal>
            </div>
            <div className="split-stack">
              <Reveal className="si">
                <div className="si-fig">
                  <ImageSlot shape="rounded" radius={4} placeholder="Drop an image" style={{ width: "100%", aspectRatio: "5/4" }} />
                </div>
                <h3>Strategy first</h3>
                <p>Every move traces back to a clear idea. Pretty without a point is just decoration.</p>
              </Reveal>
              <Reveal className="si">
                <div className="si-fig">
                  <ImageSlot shape="rounded" radius={4} placeholder="Drop an image" style={{ width: "100%", aspectRatio: "4/5" }} />
                </div>
                <h3>Craft, accelerated</h3>
                <p>We use AI to do more, faster — but a human directs every frame, word and decision.</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SCROLL-FILL STATEMENT ===== */}
      <section className="fill-band" data-screen-label="Home — Statement">
        <div className="wrap">
          <ScrollFill
            className="fill-statement"
            text="Most brands settle for being seen. We build the ones people *remember,* repeat, and *return* to."
          />
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="section-sm" id="services" data-screen-label="Home — Services" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="tag-line">
            <span>02 — What we do</span>
            <i className="ln" />
          </div>
          <div className="svc-list">
            {SERVICES.map((s, i) => (
              <Reveal key={s.num} i={i} as="a" className="svc-item" href="#services" data-cursor-label="Explore">
                <span className="s-num">{s.num}</span>
                <span className="s-name">{s.name}</span>
                <span className="s-go">↗</span>
                <span className="s-desc">{s.desc}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PinnedGallery />

      {/* ===== SECTORS ===== */}
      <section className="section" id="work" data-screen-label="Home — Sectors">
        <div className="wrap">
          <div className="tag-line">
            <span>03 — Who we serve</span>
            <i className="ln" />
          </div>
          <div className="cols cols-2" style={{ marginTop: 48 }}>
            <Reveal as="a" className="sector" href="/work">
              <div className="bg ph-img" style={{ aspectRatio: "auto", height: "100%", position: "absolute" }} />
              <span className="num">A</span>
              <h3>Jewellery Houses</h3>
              <p>Heritage and high-craft brands that need their story told with as much care as the product.</p>
            </Reveal>
            <Reveal as="a" className="sector" href="/work">
              <div className="bg ph-img" style={{ aspectRatio: "auto", height: "100%", position: "absolute" }} />
              <span className="num">B</span>
              <h3>Real Estate Builders</h3>
              <p>Developers and contractors who need launches that sell — from identity to lead generation.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats-band" data-screen-label="Home — Stats">
        <RippleCanvas intensity={0.85} />
        <div className="wrap">
          <div className="cols cols-3 stats-inner">
            <Reveal className="stat" i={0}>
              <div className="n"><CountUp to={40} suffix="+" /></div>
              <div className="l">Brands shaped</div>
            </Reveal>
            <Reveal className="stat" i={1}>
              <div className="n"><CountUp to={3.4} suffix="×" /></div>
              <div className="l">Avg. growth delivered</div>
            </Reveal>
            <Reveal className="stat" i={2}>
              <div className="n"><CountUp to={12} /></div>
              <div className="l">Cities reached</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section className="section" data-screen-label="Home — Process">
        <div className="wrap">
          <div className="tag-line">
            <span>04 — How we work</span>
            <i className="ln" />
          </div>
          <Reveal as="h2" className="display d-md" style={{ margin: "26px 0 56px", maxWidth: "17ch" }}>
            From blank page to <em>impossible to ignore.</em>
          </Reveal>
          <div className="proc-grid">
            {PROCESS.map((p, i) => (
              <Reveal key={p.n} i={i} className="proc-card">
                <span className="pn">{p.n}</span>
                <h3>{p.h}</h3>
                <p>{p.p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testi" data-screen-label="Home — Testimonials">
        <div className="wrap">
          <div className="tag-line">
            <span>05 — In their words</span>
            <i className="ln" />
          </div>
          <Reveal as="p" className="feat">
            &ldquo;They didn&apos;t just market us — they made us <em>iconic.</em> Footfall and online
            enquiries both jumped within a season.&rdquo;
          </Reveal>
          <Reveal className="by">Director — Chheda Jewellers</Reveal>
          <div className="testi-grid">
            <Reveal>
              <blockquote>
                &ldquo;The campaign visuals looked like a six-figure shoot. Our festive collection sold
                out faster than ever.&rdquo;
              </blockquote>
              <div className="by2">Founder — Girvaan</div>
            </Reveal>
            <Reveal i={1}>
              <blockquote>
                &ldquo;Finally an agency that leads with strategy. Every rupee of ad spend had a clear
                reason behind it.&rdquo;
              </blockquote>
              <div className="by2">Marketing Head — Diarah</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== CLIENTS ===== */}
      <section className="section clients-sec" id="clients" data-screen-label="Home — Clients">
        <div className="wrap">
          <div className="tag-line">
            <span>Our clients</span>
            <i className="ln" />
          </div>
          <Reveal as="h2" className="display d-md" style={{ margin: "26px 0 8px", maxWidth: "16ch" }}>
            Brands that <em>trust us.</em>
          </Reveal>
          <Reveal as="p" className="lead" style={{ marginBottom: 48 }}>
            A growing roster of jewellery houses and lifestyle brands. Twelve featured stories below.
          </Reveal>

          <div className="featured-clients">
            {FEATURED_CLIENTS.map((c, i) => (
              <FeaturedCard key={c.slug} client={c} i={i} />
            ))}
          </div>

          <div className="client-wall">
            {WALL.map((name, i) => (
              <Reveal key={name} i={i} as="span" className="cw-item">
                {name}
              </Reveal>
            ))}
          </div>
          <Reveal style={{ marginTop: 44 }}>
            <a className="btn ink" href="/clients">
              <span>See all clients</span>
              <span className="arr">↗</span>
            </a>
          </Reveal>
        </div>
      </section>

      <Faq />
    </>
  );
}
