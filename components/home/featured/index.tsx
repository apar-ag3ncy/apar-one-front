"use client";

import { UiIcon } from "@/components/ui/icon";
import { useMobileLayout } from "@/lib/motion-policy";

import { useRef } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { PhotoSlot } from "@/components/media/photo-slot";
import { useFeaturedHover } from "@/components/home/featured/use-featured-hover";
import { useFeaturedScroll } from "@/components/home/featured/use-featured-scroll";
import { HoverText } from "@/components/motion/hover-text";

export { ProgressiveQuote } from "./progressive-quote";

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
    "ratio": "1600/1067"
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
    "ratio": "1600/1195"
  },
  {
    "slug": "maison-mireyaa",
    "src": "/work/featured/mireyaa-botanical.webp",
    "title": "Maison Mireyaa",
    "type": "Botanical identity",
    "ratio": "1600/1131"
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
    "ratio": "1600/1041"
  }
];
export function FeaturedProjects() {
  const mobile = useMobileLayout();
  const grid = useRef<HTMLDivElement>(null);
  useFeaturedHover(grid);
  useFeaturedScroll(grid);
  return <section id="featured-work" className="flow-featured flow-section"><div className="wrap">
    <div className="flow-heading"><Reveal as="h2">Featured Work</Reveal></div>
    <div ref={grid} className="flow-project-grid">{SELECTED.map(project => <Link href={`/work/${project.slug}`} className="flow-project" key={project.src}>
      <div className="flow-project-image" data-edge-trim={project.slug === "signi" ? .008 : undefined}>
        <div className="flow-project-art">
        <PhotoSlot src={project.src}
        srcSet={`${project.src.replace(/\.webp$/, "-480.webp")} 480w, ${project.src.replace(/\.webp$/, "-960.webp")} 960w, ${project.src} ${"width" in project ? project.width : 1600}w`}
        sizes="(max-width: 900px) 92vw, (hover: none) and (pointer: coarse) calc(100vw - 64px), 44vw"
        placeholder={`${project.title} — ${project.type}`} fixedRatio="20/13" radius={0} style={{ width: "100%", height: "100%" }} />
        {project.slug === "girvaan" && <span className="girvaan-store-sign" aria-hidden="true">
          {/* The original client wordmark sits on the blank photographed fascia. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/girvaan.png" alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        </span>}</div></div>
      <div className="flow-project-caption"><span>{project.type}</span>
        <h3 aria-label={project.title}><i className="flow-project-arrow" aria-hidden="true"><UiIcon name="arrow-right" /></i>
          <span aria-hidden="true">{mobile ? project.title : project.title.split(" ").map((word, wi) => <span key={wi} className="flow-title-word">{[...word].map((letter, li) => <span className="flow-letter-window" key={li}><span className="flow-letter-stack"><span>{letter}</span><span>{letter}</span></span></span>)}{wi < project.title.split(" ").length - 1 ? " " : ""}</span>)}</span>
        </h3>
      </div>
    </Link>)}</div>
    <div className="flow-project-end"><Link className="btn ink" href="/clients"><HoverText>See all projects</HoverText><span className="arr" aria-hidden="true"><UiIcon name="arrow-up-right" /></span></Link></div>
  </div></section>;
}
