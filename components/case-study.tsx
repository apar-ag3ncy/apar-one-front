"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Reveal } from "./reveal";
import { CountUp } from "./count-up";
import { PhotoSlot } from "./photo-slot";
import { NextCaseScroll } from "./next-case-scroll";
import { useCaseTransition } from "./transition-provider";

export interface CaseTheme {
  bg: string;
  bg2: string;
  ink: string;
  soft: string;
  accent: string;
  accentSoft: string;
  line: string;
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
  /** Per-company typography — drives both the case page and its featured card. */
  fonts: CaseFonts;
  eyebrow: string;
  sub: string;
  theme: CaseTheme;
  heroPlaceholder: string;
  meta: { label: string; value: string }[];
  brief: { lead: React.ReactNode; challenge: string; did: string[] };
  approach: { lead: React.ReactNode; gallery: { cls: string; placeholder: string; ratio: string }[] };
  stats: { n: number; suffix?: string; label: string }[];
  quote: { text: React.ReactNode; by: string };
  next: { kicker: string; name: string; href: string; color: string; ink: string };
}

export function CaseStudy({ data }: { data: CaseData }) {
  const t = data.theme;
  const startTransition = useCaseTransition();

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
    // Per-company typography — overrides the site default --serif/--sans for this page only.
    "--serif": data.fonts.serif,
    "--sans": data.fonts.sans,
  } as React.CSSProperties;

  // Give each case page a different gallery rhythm / spacing / alignment so the
  // case studies don't all look like the same template. Deterministic per slug.
  const variant = ["a", "b", "c"][
    [...data.slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 3
  ];

  return (
    <div className="case-page" data-case={data.slug} data-variant={variant} style={themeVars}>
      {/* HERO */}
      <header className="case-hero" data-screen-label={`${data.slug} — Hero`}>
        <div className="case-wrap case-hero-in">
          <Reveal className="case-eyebrow">
            <i /> {data.eyebrow}
          </Reveal>
          <Reveal as="h1" className="case-title">
            {data.title}
          </Reveal>
          <Reveal as="p" className="case-sub">
            {data.sub}
          </Reveal>
          <Reveal className="case-meta">
            {data.meta.map((m) => (
              <div className="m" key={m.label}>
                <h4>{m.label}</h4>
                <p>{m.value}</p>
              </div>
            ))}
          </Reveal>
          <Reveal className="case-hero-fig">
            <PhotoSlot src={`/work/${data.slug}/hero.jpg`} radius={7} placeholder={data.heroPlaceholder} />
          </Reveal>
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="case-sec">
        <div className="case-wrap">
          <Reveal className="case-tag">
            <span>01 — The brief</span>
            <i className="ln" />
          </Reveal>
          <Reveal as="p" className="case-lead">
            {data.brief.lead}
          </Reveal>
          <div className="case-cols">
            <Reveal>
              <h3>The challenge</h3>
              <p>{data.brief.challenge}</p>
            </Reveal>
            <Reveal>
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
            <span>02 — The work</span>
            <i className="ln" />
          </Reveal>
          <Reveal as="p" className="case-lead">
            {data.approach.lead}
          </Reveal>
          <div className="case-gallery">
            {data.approach.gallery.map((g, i) => (
              <Reveal key={i} className={`g ${g.cls}`}>
                <PhotoSlot
                  src={`/work/${data.slug}/${i + 1}.jpg`}
                  placeholder={g.placeholder}
                  radius={6}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="case-sec">
        <div className="case-wrap">
          <Reveal className="case-tag">
            <span>03 — The results</span>
            <i className="ln" />
          </Reveal>
          <div className="case-stats">
            {data.stats.map((s, i) => (
              <Reveal key={i} i={i} className="case-stat">
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
          <Reveal as="blockquote">{data.quote.text}</Reveal>
          <Reveal className="by">{data.quote.by}</Reveal>
        </div>
      </section>

      {/* NEXT */}
      <section className="case-sec" style={{ borderBottom: 0 }}>
        <div className="case-wrap case-next">
          <a
            className="nx"
            href={data.next.href}
            onClick={(e) => {
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
          <Link className="case-btn" href="/#contact">
            Start your project ↗
          </Link>
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
