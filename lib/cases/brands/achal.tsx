import type { CaseData } from "../types";
import { FONTS_ACHAL } from "../fonts";

const data: CaseData = {
    slug: "achal",
    eyebrow: "Featured client · Real Estate",
    title: <>Achal</>,
    card: {
      name: "Achal",
      cat: "Real Estate",
      blurb: "Where address becomes aspiration - branding, content and campaigns for premium real estate.",
    },
    logoTint: "#C9A062",
    fonts: FONTS_ACHAL,
    sub: "Premium real estate, positioned with confidence - a navy world that makes an address feel like a landmark.",
    theme: {
      bg: "#2A3B59",
      bg2: "#38507A",
      ink: "#DCE4F2",
      soft: "rgba(220,228,242,.72)",
      accent: "#DCE4F2",
      accentSoft: "rgba(220,228,242,.16)",
      line: "rgba(220,228,242,.20)",
    },
    heroPlaceholder: "Drop Achal hero image (navy / architectural)",
    meta: [
      { label: "Services", value: "Branding · Content · Campaigns" },
      { label: "Sector", value: "Real Estate" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "Landmark projects that read as ordinary listings - premium real estate without a premium brand.",
      challenge:
        "Achal needed a brand as considered as its developments - one that signalled trust and aspiration to serious buyers, with marketing that filled site visits and turned interest into bookings.",
      did: [
        "Brand identity - navy & light system",
        "Project launch campaigns",
        "Always-on social & content",
        "Performance marketing for site visits",
      ],
    },
    approach: {
      lead: (
        <>
          Confident, architectural and quietly <em>premium</em> - a brand that makes an address aspirational.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Project key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Tower / elevation", ratio: "4/5" },
        { cls: "half", placeholder: "Brochure / identity", ratio: "5/4" },
        { cls: "half", placeholder: "Social / campaign", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 2.9, suffix: "×", label: "Qualified site visits" },
      { n: 38, suffix: "%", label: "Lower cost per lead" },
      { n: 3.3, suffix: "×", label: "Campaign ROAS" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our projects finally feel like the <em>landmarks</em> they are.&rdquo;
        </>
      ),
      by: "Director - Achal",
    },
    next: { kicker: "Next case", name: "High on Smiles", href: "/work/high-on-smiles", color: "#4A80C6", ink: "#FFFFFF" },
  };

export default data;
