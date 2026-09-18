"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Reveal } from "./reveal";
import { CountUp } from "./count-up";
import { PhotoSlot } from "./photo-slot";
import { VideoSlot } from "./video-slot";
import { NextCaseScroll } from "./next-case-scroll";
import { LiquidGlass } from "./liquid-glass";
import { useCaseTransition } from "./transition-provider";
import type { CaseAssets } from "@/lib/case-assets";

export interface CaseTheme {
  bg: string;
  bg2: string;
  ink: string;
  soft: string;
  accent: string;
  accentSoft: string;
  line: string;
  /** Glass tone for the case page. Derived from `bg` luminance when omitted:
   *  white glass on dark backgrounds, smoked glass on mid-light ones (so light
   *  ink keeps WCAG AA contrast over the panes). Set to force either. */
  glass?: "light" | "dark";
}

/** WCAG relative luminance of a #rrggbb colour (null if not 6-digit hex). */
function relLum(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
  quote: { text: React.ReactNode; by: string };
  next: { kicker: string; name: string; href: string; color: string; ink: string };
}

export function CaseStudy({ data, assets }: { data: CaseData; assets: CaseAssets }) {
  const t = data.theme;
  const startTransition = useCaseTransition();
  // Smoked glass above bg luminance .09 (Girvaan .136, Jatubhai .143, High on
  // Smiles .210); the other nine themes sit at or below .047 -> white glass.
  const glass = t.glass ?? ((relLum(t.bg) ?? 0) > 0.09 ? "dark" : "light");

  // Paint the whole page (incl. body / overscroll) in the case theme colour,
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
  }, [t.bg]);

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

  // Branded fallback for frames with no photo yet: the client's logo on a panel
  // in the page's own colours (same logo + flags the featured cards use), so no
  // page ever shows a drop-zone note to a visitor.
  const brand = {
    logo: data.logo ?? `/logos/${data.slug}.png`,
    logoTint: data.logoTint,
    logoInvert: data.logoInvert,
  };

  // Give each case page a different gallery rhythm / spacing / alignment so the
  // case studies don't all look like the same template. Deterministic per slug.
  const variant = ["a", "b", "c"][
    [...data.slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 3
  ];

  return (
    <div className="case-page" data-case={data.slug} data-variant={variant} data-glass={glass} style={themeVars}>
      {/* The liquid under the glass: the page's own colours drifting behind every
          frosted .glass surface below (see docs/adr/0002). */}
      <LiquidGlass />

      {/* HERO */}
      <header className="case-hero" data-screen-label={`${data.slug} - Hero`}>
        <div className="case-wrap case-hero-in">
          {/* Desktop: copy on the left, the creative on the right, bottom-aligned
              on one baseline so the whole hero sits in the first screen. Phones
              and tablets stack. */}
          <div className="case-hero-copy">
            <Reveal className="case-eyebrow">
              <i /> {data.eyebrow}
            </Reveal>
            <Reveal as="h1" className="case-title">
              {data.title}
            </Reveal>
            <Reveal as="p" className="case-sub">
              {data.sub}
            </Reveal>
            <Reveal className="case-meta glass">
              {data.meta.map((m) => (
                <div className="m" key={m.label}>
                  <h4>{m.label}</h4>
                  <p>{m.value}</p>
                </div>
              ))}
            </Reveal>
          </div>
          {/* With a real creative: the full 9:16 post, centred and height-capped.
              Without one: a wide branded panel across the wrap (is-fallback) -
              a designed hero visual rather than an empty phone. */}
          <Reveal className={`case-hero-fig glass glass-media${assets.hero ? "" : " is-fallback"}`}>
            <PhotoSlot
              src={assets.hero ? `/work/${data.slug}/hero.jpg` : undefined}
              radius={11}
              placeholder={data.heroPlaceholder}
              priority
              {...brand}
            />
          </Reveal>
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

      {/* APPROACH */}
      <section className="case-sec">
        <div className="case-wrap">
          <Reveal className="case-tag">
            <span>02 - The work</span>
            <i className="ln" />
          </Reveal>
          <Reveal as="p" className="case-lead">
            {data.approach.lead}
          </Reveal>
          <div className="case-gallery">
            {data.approach.gallery.map((g, i) => (
              <Reveal key={i} className={`g glass glass-media ${g.cls}`}>
                {g.video ? (
                  <VideoSlot src={g.video} placeholder={g.placeholder} radius={11} style={{ aspectRatio: g.ratio }} />
                ) : (
                  <PhotoSlot
                    src={assets.photos[i] ? `/work/${data.slug}/${i + 1}.jpg` : undefined}
                    placeholder={g.placeholder}
                    radius={11}
                    // A real photo takes its natural ratio (the hint only reserves
                    // space); branded fallbacks all share one portrait ratio so
                    // the grid rows stay level instead of ragged.
                    ratio={assets.photos[i] ? g.ratio : "4/5"}
                    caption={g.placeholder}
                    {...brand}
                  />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="case-sec">
        <div className="case-wrap">
          <Reveal className="case-tag">
            <span>03 - The results</span>
            <i className="ln" />
          </Reveal>
          <div className="case-stats">
            {data.stats.map((s, i) => (
              <Reveal key={i} i={i} className="case-stat glass">
                <div className="n">
                  <CountUp to={s.n} suffix={s.suffix} />
                </div>
                <div className="l">{s.label}</div>
              </Reveal>
            ))}
          </div>
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
          {/* Painted in the NEXT client's colours: a preview of where the wipe
              (same `next.color`) is about to take the visitor. */}
          <div
            className="case-next"
            style={{ "--nx-bg": data.next.color, "--nx-ink": data.next.ink } as React.CSSProperties}
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
                  color: data.next.color,
                  ink: data.next.ink,
                  label: data.next.name,
                });
              }}
            >
              <div className="nx-l">{data.next.kicker}</div>
              <div className="nx-name">{data.next.name} ↗</div>
            </a>
            <Link className="case-btn" href="/start">
              Start your project ↗
            </Link>
          </div>
        </div>
      </section>

      <NextCaseScroll
        href={data.next.href}
        name={data.next.name}
        color={data.next.color}
        ink={data.next.ink}
      />
    </div>
  );
}
