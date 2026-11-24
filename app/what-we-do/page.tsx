import type { Metadata } from "next";
import "@/styles/inner-mobile.css";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { HoverText } from "@/components/motion/hover-text";
import { InternalPageHeader } from "@/components/layout/internal-page-header";

export const metadata: Metadata = {
  title: "What we do — APAR AGENTIVE CREACY",
  description:
    "APAR builds brands, runs their marketing and manages the social handles for a focused roster of jewellery houses and premium brands. Founded by Preyansh Vora.",
};

const PILLARS = [
  {
    num: "01",
    name: "We build the brand",
    desc: "Identity, positioning and the whole visual world a brand lives in - crafted to be impossible to ignore, and built to last.",
    deliverables: ["Brand strategy", "Visual identity", "Art direction"],
  },
  {
    num: "02",
    name: "We run the marketing",
    desc: "Strategy, campaigns and performance - measured, not guessed. We turn attention into growth, season after season.",
    deliverables: ["Campaign strategy", "Creative production", "Performance marketing"],
  },
  {
    num: "03",
    name: "We manage the socials",
    desc: "We hold the handles. Content, community and calendar for our clients' feeds - showing up daily, on-brand, in culture.",
    deliverables: ["Content planning", "Community", "Social campaigns"],
  },
];

export default function WhatWeDoPage() {
  return (
    <main className="services-page">
      <InternalPageHeader
        eyebrow="What we do"
        title={<>We build brands — and <em>look after them.</em></>}
        label="What we do - Hero"
      >
        APAR is a branding and digital-marketing studio. We craft the identity, run the
        marketing, and manage the social handles for a short, hand-picked roster of jewellery
        houses and premium brands - showing up every day so every touchpoint feels considered.
      </InternalPageHeader>

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="What we do - Pillars">
        <div className="wrap">
          <h2 className="tag-line">
            <span>How we help</span>
            <i className="ln" />
          </h2>
          <div className="service-pillars">
            {PILLARS.map((p, i) => (
              <Reveal
                key={p.num}
                i={i}
                className="service-pillar"
              >
                <span className="service-number">
                  {p.num}
                </span>
                <div>
                  <h3 className="display">
                    {p.name}
                  </h3>
                  <p>
                    {p.desc}
                  </p>
                </div>
                <ul className="service-deliverables" aria-label={`${p.name} includes`}>
                  {p.deliverables.map(item => <li key={item}>{item}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section service-client-section" data-screen-label="What we do - Clients">
        <div className="wrap">
          <Reveal as="p" className="display service-client-statement">
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
          <div className="cols cols-2 service-founder">
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
              <Link className="btn-ghost service-team-link" href="/team"><HoverText>Meet the people behind APĀR</HoverText></Link>
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
                <HoverText>Start a project</HoverText>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
