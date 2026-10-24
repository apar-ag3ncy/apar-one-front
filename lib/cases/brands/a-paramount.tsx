import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "a-paramount",
    eyebrow: "Featured client · Engineering",
    title: <>A Paramount</>,
    card: {
      name: "A Paramount",
      cat: "Engineering",
      blurb: "Engineered to exacting standards - branding, website and lead generation for an engineering works.",
    },
    fonts: FONTS_DEFAULT,
    sub: "An engineering works built on precision - given a brand and digital presence as solid and exacting as its output.",
    theme: {
      bg: "#181712",
      bg2: "#262318",
      ink: "#ECE6D6",
      soft: "rgba(236,230,214,.70)",
      accent: "#A28E4F",
      accentSoft: "rgba(162,142,79,.20)",
      line: "rgba(236,230,214,.16)",
    },
    heroPlaceholder: "A Paramount — carved temple ceiling",
    meta: [
      { label: "Services", value: "Branding · Website · Lead Gen" },
      { label: "Sector", value: "Engineering · Manufacturing" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project" },
    ],
    brief: {
      lead: "World-class engineering hidden behind a dated brand and an all-but-invisible web presence.",
      challenge:
        "A Paramount needed to look as precise and dependable as its work - a brand and website that earned trust with serious B2B buyers, plus a steady pipeline of qualified enquiries.",
      did: [
        "Brand identity - industrial & refined",
        "Website & technical content",
        "Lead-generation campaigns",
        "Company profile & catalogue design",
      ],
    },
    approach: {
      lead: (
        <>
          Solid, precise and quietly <em>premium</em> - engineering presented with the confidence it earns.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Temple entrance · Inlay and jaali", ratio: "4/3" },
        { cls: "tall", placeholder: "Brass door · Embossed detail", ratio: "3/4" },
        { cls: "wide", placeholder: "Silver bajot · Sculpted form", ratio: "4/3" },
        { cls: "wide", placeholder: "Chattar · Ornate metalwork", ratio: "4/3" },
        { cls: "wide", placeholder: "Ceremonial rath · Architecture in miniature", ratio: "4/3" },
        { cls: "wide", placeholder: "Pakshal kalash · Ritual craft", ratio: "4/3" },
        { cls: "wide", placeholder: "Shatrunjay panel · Relief detail", ratio: "4/3" },
        { cls: "wide", placeholder: "Diya sanctum · Light and atmosphere", ratio: "1/1" },
      ],
    },
    stats: [
      { n: 3.2, suffix: "×", label: "Qualified enquiries" },
      { n: 48, suffix: "%", label: "Lower cost per lead" },
      { n: 2.5, suffix: "×", label: "Website conversions" },
    ],
    quote: {
      text: (
        <>
          &ldquo;We finally look like the <em>precision</em> house we are.&rdquo;
        </>
      ),
      by: "Director - A Paramount",
    },
    next: { kicker: "Next case", name: "Kundan Jewellers", href: "/work/kundan-jewellers", color: "#34251A", ink: "#EBDFCD" },
  };

export default data;
