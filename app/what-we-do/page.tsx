import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "What we do - APAR Digital Marketing & Branding Agency",
  description:
    "APAR builds brands, runs their marketing and manages the social handles for a focused roster of jewellery houses and premium brands. Founded by Preyansh Vora.",
};

const PILLARS = [
  {
    num: "01",
    name: "We build the brand",
    desc: "Identity, positioning and the whole visual world a brand lives in - crafted to be impossible to ignore, and built to last.",
  },
  {
    num: "02",
    name: "We run the marketing",
    desc: "Strategy, campaigns and performance - measured, not guessed. We turn attention into growth, season after season.",
  },
  {
    num: "03",
    name: "We manage the socials",
    desc: "We hold the handles. Content, community and calendar for our clients' feeds - showing up daily, on-brand, in culture.",
  },
];

export default function WhatWeDoPage() {
  return (
    <>
      <section className="page-hero" data-screen-label="What we do - Hero">
        <div className="wrap">
          <Reveal className="eyebrow">
            <i className="dot" /> What we do
          </Reveal>
          <Reveal as="h1" className="display d-lg" style={{ marginTop: 8, maxWidth: "16ch" }}>
            We build brands - and <em>look after them.</em>
          </Reveal>
          <Reveal as="p" className="lead" i={1} style={{ maxWidth: "54ch" }}>
            APAR is a branding and digital-marketing studio. We craft the identity, run the
            marketing, and manage the social handles for a short, hand-picked roster of jewellery
            houses and premium brands - showing up every day so every touchpoint feels considered.
          </Reveal>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="What we do - Pillars">
        <div className="wrap">
          <div className="tag-line">
            <span>How we help</span>
            <i className="ln" />
          </div>
          <div style={{ marginTop: 40 }}>
            {PILLARS.map((p, i) => (
              <Reveal
                key={p.num}
                i={i}
                className="wwd-pillar"
                style={{
                  display: "grid",
                  gridTemplateColumns: "clamp(44px,5vw,72px) 1fr",
                  gap: "clamp(16px,3vw,40px)",
                  padding: "clamp(26px,3.4vw,40px) 6px",
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, color: "var(--ink-mid)" }}
                >
                  {p.num}
                </span>
                <div>
                  <h3
                    className="display"
                    style={{ fontSize: "clamp(26px,3vw,40px)", lineHeight: 1.05, letterSpacing: "-0.01em", margin: 0 }}
                  >
                    {p.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "clamp(15px,1.15vw,17px)",
                      lineHeight: 1.6,
                      color: "var(--ink-soft)",
                      maxWidth: "50ch",
                      margin: "14px 0 0",
                    }}
                  >
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" data-screen-label="What we do - Clients">
        <div className="wrap">
          <Reveal as="p" className="display d-md" style={{ maxWidth: "24ch" }}>
            We&apos;re the team behind <em>Chheda, Girvaan, Achal, Maison Mireyaa, Signi</em> and a
            growing roster of houses across Mumbai and beyond.
          </Reveal>
        </div>
      </section>

      <section className="section" data-screen-label="What we do - Founder">
        <div className="wrap">
          <div className="tag-line">
            <span>The founder</span>
            <i className="ln" />
          </div>
          <div className="cols cols-2" style={{ marginTop: 44, alignItems: "start" }}>
            <Reveal as="h2" className="display d-md">
              Built by <em>Preyansh Vora.</em>
            </Reveal>
            <Reveal i={1}>
              <p className="lead" style={{ marginTop: 0 }}>
                APAR was founded by <strong>Preyansh Vora</strong>, who built the agency - and the
                team behind it - to give a deliberately short client list the kind of obsessive
                attention most brands never get.
              </p>
              <p className="lead" style={{ marginTop: 20 }}>
                Every brief still runs through people who care about the last pixel, the next post,
                and the numbers underneath. Strategy and craft, under one roof, with a human
                directing every decision.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="What we do - CTA">
        <div className="wrap">
          <div className="divline" />
          <div className="work-foot">
            <Reveal as="h2" className="display d-md">
              Ready to be <em>impossible to ignore?</em>
            </Reveal>
            <Reveal i={1}>
              <Link className="btn" href="/start">
                <span>Start a project</span>
                <span className="arr">↗</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
