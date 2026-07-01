"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Cover image for the frame. Set only where a real campaign photo exists in
   *  /public/work/<slug>/; leave undefined and the branded logo fallback (below)
   *  or the "Drop … image" placeholder shows (drop a hero.jpg in that folder +
   *  add its path here to fill it with a real photo). */
  img?: string;
  /** Brand logo (/logos/<slug>.png) shown as a tasteful contained-logo card when
   *  no real campaign `img` exists yet - so no frame ever looks unfinished. */
  logo?: string;
}[] = [
  { href: "/work/chheda", cat: "jewellery", span: 7, ratio: "9/16", tag: "Jewellery", title: "Chheda Jewellers", year: "2026", desc: "Brand identity · Festive campaigns · Social growth", slot: "Drop Chheda image", img: "/work/chheda/hero.jpg" },
  { href: "/work/girvaan", cat: "jewellery", span: 5, ratio: "9/16", tag: "Jewellery", title: "Girvaan", year: "2025", desc: "Identity, content engine & performance ads", slot: "Drop Girvaan image", img: "/work/girvaan/hero.jpg" },
  { href: "/work/maison-mireyaa", cat: "lifestyle", span: 4, ratio: "4/5", tag: "Florist", title: "Maison Mireyaa", year: "2025", desc: "Branding, seasonal content & campaigns", slot: "Drop Maison Mireyaa image", img: "/work/maison-mireyaa/hero.jpg" },
  { href: "/work/achal", cat: "lifestyle", span: 4, ratio: "4/5", tag: "Real Estate", title: "Achal", year: "2025", desc: "Premium real estate - branding & campaigns", slot: "Drop Achal image", img: "/work/achal/hero.jpg" },
  { href: "/work/signi", cat: "jewellery", span: 4, ratio: "4/5", tag: "Lab-Grown Gems", title: "Signi", year: "2025", desc: "Lab-grown gems - brand, content & campaigns", slot: "Drop Signi image", img: "/work/signi/3.jpg" },
];

const FILTERS: { key: Cat; label: string }[] = [
  { key: "all", label: "All work" },
  { key: "jewellery", label: "Jewellery" },
  { key: "lifestyle", label: "Lifestyle" },
];

export default function WorkPage() {
  const [filter, setFilter] = useState<Cat>("all");
  const shown = CARDS.filter((c) => filter === "all" || c.cat === filter);
  const gridRef = useRef<HTMLDivElement>(null);

  // Masonry: give each card a grid row-span equal to its (photo-driven) height so
  // varied-ratio cards pack tightly with no gaps and none ever splits. Re-runs on
  // filter change, image load, and resize. Cards use align-self:start (see CSS) so
  // their measured height is the true content height, not a stretched grid track.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const GAP = 32;
    let raf = 0;
    const layout = () => {
      grid.querySelectorAll<HTMLElement>(".work-card").forEach((card) => {
        const h = card.getBoundingClientRect().height;
        if (h > 0) card.style.gridRowEnd = `span ${Math.ceil(h) + GAP}`;
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(grid);
    const imgs = Array.from(grid.querySelectorAll("img"));
    imgs.forEach((img) => {
      if (!(img as HTMLImageElement).complete) img.addEventListener("load", schedule);
    });
    window.addEventListener("resize", schedule);
    const timers = [setTimeout(schedule, 300), setTimeout(schedule, 1000)];
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", schedule));
      window.removeEventListener("resize", schedule);
      timers.forEach(clearTimeout);
    };
  }, [filter]);

  return (
    <>
      <section className="page-hero" data-screen-label="Work - Hero">
        <div className="wrap">
          <Reveal className="eyebrow">
            <i className="dot" /> Selected work - 2024-2026
          </Reveal>
          <Reveal as="h1" className="display d-lg" style={{ marginTop: 8 }}>
            Proof, not <em>promises.</em>
          </Reveal>
          <Reveal as="p" className="lead" i={1}>
            A focused body of work for jewellery houses and ambitious lifestyle brands - identities,
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

      <section className="section" style={{ paddingTop: 24 }} data-screen-label="Work - Grid">
        <div className="wrap">
          <div className="work-grid" ref={gridRef}>
            {shown.map((c, i) => (
              <Reveal
                key={c.title}
                i={i % 2}
                as={Link}
                href={c.href}
                className="work-card"
                data-cat={c.cat}
              >
                <div className="frame">
                  <span className="tagpill">{c.tag}</span>
                  <ImageSlot
                    shape="rounded"
                    radius={4}
                    src={c.img}
                    logo={c.logo}
                    alt={c.title}
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

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="Work - CTA strip">
        <div className="wrap">
          <div className="divline" />
          <div className="work-foot">
            <Reveal as="h2" className="display d-md">
              Your brand could be <em>next.</em>
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
