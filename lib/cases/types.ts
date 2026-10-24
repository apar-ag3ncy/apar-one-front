import type { ReactNode } from "react";

export interface CaseTheme {
  bg: string;
  bg2: string;
  ink: string;
  soft: string;
  accent: string;
  accentSoft: string;
  line: string;
  /** Legacy brand-surface metadata. Internal story presentation is configured
   *  independently in lib/cases/presentation.ts. */
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
  title: ReactNode;
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
  brief: { lead: ReactNode; challenge: string; did: string[] };
  approach: {
    lead: ReactNode;
    /** Grid items render as photos (/work/<slug>/<i>.jpg) by default; set
     *  `video` to a /videos/... path to play a looping film in that frame. */
    gallery: { cls: string; placeholder: string; ratio: string; video?: string }[];
  };
  stats: { n: number; suffix?: string; label: string }[];
  /** Image-led stories can describe their visual outcome without unverified KPIs. */
  resultsLabel?: string;
  resultsNote?: ReactNode;
  quote: { text: ReactNode; by: string };
  next: { kicker: string; name: string; href: string; color: string; ink: string };
}

export interface FeaturedClient {
  slug: string;
  href: string;
  i: string;
  cat: string;
  name: string;
  blurb: string;
  logo: string;
  logoInvert: boolean;
  logoTint?: string;
  year: string;
  theme: CaseTheme;
  fonts: CaseFonts;
}
