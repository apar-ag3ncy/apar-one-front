"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { VelocityMarquee } from "@/components/velocity-marquee";
import { ImageSlot } from "@/components/image-slot";

type Cat = "all" | "jewellery" | "lifestyle";

const CARDS: {
  href: string;
  cat: Exclude<Cat, "all">;
  span: number;
  ratio: string;
  tag: string;
  title: string;
  year: string;
  desc: string;
  slot: string;
}[] = [
  { href: "/work/chheda", cat: "jewellery", span: 7, ratio: "16/11", tag: "Jewellery", title: "Chheda Jewellers", year: "2026", desc: "Brand identity · Festive campaigns · Social growth", slot: "Drop Chheda image" },
  { href: "/work/girvaan", cat: "jewellery", span: 5, ratio: "4/5", tag: "Jewellery", title: "Girvaan", year: "2025", desc: "Identity, content engine & performance ads", slot: "Drop Girvaan image" },
  { href: "/work/diarah", cat: "jewellery", span: 5, ratio: "4/5", tag: "Jewellery", title: "Diarah", year: "2025", desc: "Luxury rebrand & full-funnel campaigns", slot: "Drop Diarah image" },
  { href: "/work/high-on-smiles", cat: "lifestyle", span: 7, ratio: "16/11", tag: "Dental", title: "High on Smiles", year: "2024", desc: "Modern dental clinic — brand, content & campaigns", slot: "Drop High on Smiles image" },
  { href: "/work/silver-emporium", cat: "jewellery", span: 4, ratio: "1/1", tag: "Silver", title: "Silver Emporium", year: "2025", desc: "Heritage silver — branding, content & campaigns", slot: "Drop Silver Emporium image" },
  { href: "/work/kundan-jewellers", cat: "jewellery", span: 4, ratio: "1/1", tag: "Jewellery", title: "Kundan Jewellers", year: "2025", desc: "Identity, content & festive campaigns", slot: "Drop Kundan image" },
  { href: "/work/maison-mireyaa", cat: "lifestyle", span: 4, ratio: "1/1", tag: "Florist", title: "Maison Mireyaa", year: "2025", desc: "Branding, seasonal content & campaigns", slot: "Drop Maison Mireyaa image" },
  { href: "/work/achal", cat: "lifestyle", span: 4, ratio: "1/1", tag: "Real Estate", title: "Achal", year: "2025", desc: "Premium real estate — branding & campaigns", slot: "Drop Achal image" },
  { href: "/work/a-paramount", cat: "lifestyle", span: 4, ratio: "1/1", tag: "Engineering", title: "A Paramount", year: "2025", desc: "Engineering works — brand, web & lead gen", slot: "Drop A Paramount image" },
  { href: "/work/jatubhai-velji", cat: "jewellery", span: 4, ratio: "1/1", tag: "Jewellery", title: "Jatubhai Velji", year: "2025", desc: "Heritage jewellery — identity, content & campaigns", slot: "Drop Jatubhai Velji image" },
  { href: "/work/signi", cat: "jewellery", span: 4, ratio: "1/1", tag: "Lab-Grown Gems", title: "Signi", year: "2025", desc: "Lab-grown gems — brand, content & campaigns", slot: "Drop Signi image" },
  { href: "/work/tarava", cat: "jewellery", span: 4, ratio: "1/1", tag: "Fine Silver", title: "Tarava", year: "2025", desc: "Fine silver jewellery — brand, content & campaigns", slot: "Drop Tarava image" },
];

const FILTERS: { key: Cat; label: string }[] = [
  { key: "all", label: "All work" },
  { key: "jewellery", label: "Jewellery" },
  { key: "lifestyle", label: "Lifestyle" },
];

export default function WorkPage() {
  const [filter, setFilter] = useState<Cat>("all");
  const shown = CARDS.filter((c) => filter === "all" || c.cat === filter);

  return (
    <>
      <section className="page-hero" data-screen-label="Work — Hero">
        <div className="wrap">
          <Reveal className="eyebrow">
            <i className="dot" /> Selected work — 2024–2026
          </Reveal>
          <Reveal as="h1" className="display d-lg" style={{ marginTop: 8 }}>
            Proof, not <em>promises.</em>
          </Reveal>
          <Reveal as="p" className="lead" i={1}>
            A focused body of work for jewellery houses and ambitious lifestyle brands — identities,
            campaigns and content engines that moved real numbers.
          </Reveal>
          <Reveal className="filter-row" i={2}>
            {FILTERS.map((f) => (
              <span
                key={f.key}
                className={"chip" + (filter === f.key ? " sel" : "")}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <VelocityMarquee />

      <section className="section" style={{ paddingTop: 24 }} data-screen-label="Work — Grid">
        <div className="wrap">
          <div className="work-grid">
            {shown.map((c, i) => (
              <Reveal
                key={c.title}
                i={i % 2}
                as={Link}
                href={c.href}
                className="work-card"
                data-cat={c.cat}
                style={{ gridColumn: `span ${c.span}` }}
              >
                <div className="frame">
                  <span className="tagpill">{c.tag}</span>
                  <ImageSlot
                    shape="rounded"
                    radius={4}
                    placeholder={c.slot}
                    style={{ width: "100%", aspectRatio: c.ratio }}
                  />
                </div>
                <div className="cap">
                  <h3>{c.title}</h3>
                  <span className="yr">{c.year}</span>
                </div>
                <div className="cap" style={{ marginTop: 0 }}>
                  <p>{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {shown.length === 0 && <p className="empty-note">No projects in this category yet.</p>}
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="Work — CTA strip">
        <div className="wrap">
          <div className="divline" />
          <div className="work-foot">
            <Reveal as="h2" className="display d-md">
              Your brand could be <em>next.</em>
            </Reveal>
            <Reveal i={1}>
              <Link className="btn" href="/#contact">
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
