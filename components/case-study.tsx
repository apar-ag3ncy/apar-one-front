"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Reveal } from "./reveal";
import { CountUp } from "./count-up";
import { PhotoSlot } from "./photo-slot";
import { NextCaseScroll } from "./next-case-scroll";
import { useCaseTransition } from "./transition-provider";
import { CaseGalleryJourney } from "./case-motion/case-gallery";
import { useCaseMotion } from "./case-motion/use-case-motion";
import { caseMotion } from "@/lib/case-motion";
import { CASE_PAGE_THEME } from "@/lib/case-presentation";
import type { CaseAssets } from "@/lib/case-assets";
import { HoverText } from "./hover-text";

export interface CaseTheme {
  bg: string;
  bg2: string;
  ink: string;
  soft: string;
  accent: string;
  accentSoft: string;
  line: string;
  /** Legacy brand-surface metadata. Internal story presentation is configured
   *  independently in lib/case-presentation.ts. */
  glass?: "light" | "dark";
}

export interface CaseFonts {
  /** CSS font-family stack for display/serif type (titles, leads, quotes). */
  serif: string;
  /** CSS font-family stack for body/sans type (eyebrow, labels, copy). */
  sans: string;
}

export interface CaseData {
  slug: string;
  title: React.ReactNode;
  /** Plain-text fields used by the featured-client cards (home + clients pages). */
  card: { name: string; cat: string; blurb: string };
  /** Optional brand logo shown on the featured card at rest (path under /public). */
  logo?: string;
  /** Force the logo to render as a white silhouette (for brand-coloured logos
   *  whose colour matches their card background). */
  logoInvert?: boolean;
  /** Render the logo as a solid silhouette of this exact colour (e.g. gold),
   *  via an image mask. Takes precedence over logoInvert. */
  logoTint?: string;
  /** Per-company typography - drives both the case page and its featured card. */
  fonts: CaseFonts;
  eyebrow: string;
  sub: string;
  theme: CaseTheme;
  heroPlaceholder: string;
  meta: { label: string; value: string }[];
  brief: { lead: React.ReactNode; challenge: string; did: string[] };
  approach: {
    lead: React.ReactNode;
    /** Grid items render as photos (/work/<slug>/<i>.jpg) by default; set
     *  `video` to a /videos/... path to play a looping film in that frame. */
    gallery: { cls: string; placeholder: string; ratio: string; video?: string }[];
  };
  stats: { n: number; suffix?: string; label: string }[];
  /** Image-led stories can describe their visual outcome without unverified KPIs. */
  resultsLabel?: string;
  resultsNote?: React.ReactNode;
  quote: { text: React.ReactNode; by: string };
  next: { kicker: string; name: string; href: string; color: string; ink: string };
}

export function CaseStudy({ data, assets }: { data: CaseData; assets: CaseAssets }) {
  const root = useRef<HTMLDivElement>(null);
  const profile = caseMotion(data.slug);
  useCaseMotion(root, profile);
  const nextProfile = caseMotion(data.next.href.split("/").pop() ?? "");
  const t = CASE_PAGE_THEME;
  const startTransition = useCaseTransition();

  // Paint the whole page (incl. body / overscroll) in the internal-page colour,
  // then restore the cream default on unmount.
  useEffect(() => {
    // Start each case at the top so a scroll-to-next from the previous page
    // can't land already-at-bottom and chain straight through.
    window.scrollTo(0, 0);
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = t.bg;
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, [data.slug, t.bg]);

  const themeVars = {
    "--c-bg": t.bg,
    "--c-bg2": t.bg2,
    "--c-ink": t.ink,
    "--c-soft": t.soft,
    "--c-accent": t.accent,
    "--c-accent-soft": t.accentSoft,
    "--c-line": t.line,
    // Per-company typography - overrides the site default --serif/--sans for this page only.
    "--serif": data.fonts.serif,
    "--sans": data.fonts.sans,
  } as React.CSSProperties;

  // The editorial page stays white; identity cards retain the client's palette.
  const brand = {
    logo: data.logo ?? `/logos/${data.slug}.png`,
    logoTint: data.logoTint,
    logoInvert: data.logoInvert,
    logoSurface: `linear-gradient(145deg, ${data.theme.bg2}, ${data.theme.bg})`,
  };

  // Preserve the existing brief/section spacing variants. Motion is configured
  // explicitly per brand in lib/case-motion.ts.
  const variant = ["a", "b", "c"][
    [...data.slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 3
  ];

  return (
    <div ref={root} className="case-page case-cinematic" data-form={profile.form} data-case={data.slug} data-variant={variant} data-glass="light" data-presentation="white" style={themeVars}>
      {/* HERO */}
      <header className="case-hero" data-screen-label={`${data.slug} - Hero`}>
        <div className="case-wrap case-hero-in">
          {/* Desktop pairs the copy with the original-ratio artwork. Touch
              layouts stack; each page owns its opening choreography. */}
          <div className="case-hero-copy">
            <div className="case-eyebrow">
              <i /> {data.eyebrow}
            </div>
            <h1 className="case-title">
              {data.title}
            </h1>
            <p className="case-sub">
              {data.sub}
            </p>
            <div className="case-meta">
              {data.meta.map((m) => (
                <div className="m" key={m.label}>
                  <h4>{m.label}</h4>
                  <p>{m.value}</p>
                </div>
              ))}
            </div>
            <a className="case-explore" href="#case-work"><HoverText>Explore the work</HoverText><span aria-hidden="true">↓</span></a>
          </div>
          {/* Actual artwork keeps its measured aspect ratio. Missing campaign
              assets use the existing client identity rather than a blank frame. */}
          <div className={`case-hero-fig${assets.hero ? "" : " is-fallback"}`} style={{ "--hero-ratio": assets.heroRatio ?? .8 } as React.CSSProperties}><div className="case-hero-media">
            <PhotoSlot
              src={assets.heroSrc}
              radius={18}
              ratio={String(assets.heroRatio ?? .8)}
              placeholder={data.card.name}
              priority
              {...brand}
            />
          </div></div>
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="case-sec">
        <div className="case-wrap">
          <Reveal className="case-tag">
            <span>01 - The brief</span>
            <i className="ln" />
          </Reveal>
          <Reveal as="p" className="case-lead">
            {data.brief.lead}
          </Reveal>
          <div className="case-cols">
            <Reveal className="glass">
              <h3>The challenge</h3>
              <p>{data.brief.challenge}</p>
            </Reveal>
            <Reveal className="glass">
              <h3>What we did</h3>
              <ul className="case-list">
                {data.brief.did.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* A native gallery on touch/reduced motion; a pinned horizontal journey on desktop. */}
      <div id="case-work"><CaseGalleryJourney data={data} assets={assets} /></div>

      {/* RESULTS */}
      <section className="case-sec" id="case-results">
        <div className="case-wrap">
          <Reveal className="case-tag">
            <span>03 - {data.resultsLabel ?? "The results"}</span>
            <i className="ln" />
          </Reveal>
          {data.resultsNote && <Reveal as="p" className="case-lead">{data.resultsNote}</Reveal>}
          {data.stats.length > 0 && <div className="case-stats">
            {data.stats.map((s, i) => (
              <Reveal key={i} i={i} className="case-stat glass">
                <div className="n">
                  <CountUp to={s.n} suffix={s.suffix} />
                </div>
                <div className="l">{s.label}</div>
              </Reveal>
            ))}
          </div>}
        </div>
      </section>

      {/* QUOTE */}
      <section className="case-quote">
        <div className="case-wrap">
          <Reveal className="glass glass-quote">
            <blockquote>{data.quote.text}</blockquote>
            <div className="by">{data.quote.by}</div>
          </Reveal>
        </div>
      </section>

      {/* NEXT */}
      <section className="case-sec">
        <div className="case-wrap">
          {/* The next story keeps the same white surface and transition motion. */}
          <div
            className="case-next"
            style={{ "--nx-bg": t.bg, "--nx-ink": t.ink } as React.CSSProperties}
          >
            <a
              className="nx"
              href={data.next.href}
              onClick={(e) => {
                // plain left click only - cmd/ctrl/shift/middle keep the
                // browser's open-in-new-tab behaviour
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                startTransition({
                  href: data.next.href,
                  color: t.bg,
                  ink: t.ink,
                  label: data.next.name,
                });
              }}
            >
              <div className="nx-l">{data.next.kicker}</div>
              <div className="nx-name">{data.next.name} ↗</div>
            </a>
            {nextProfile.cover && <div className="case-next-art" aria-hidden="true"><PhotoSlot src={nextProfile.cover} fixedRatio="20/13" radius={15} /></div>}
            <Link className="case-btn" href="/start">
              <HoverText>Start your project</HoverText><span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <NextCaseScroll
        href={data.next.href}
        name={data.next.name}
        color={t.bg}
        ink={t.ink}
      />
    </div>
  );
}
