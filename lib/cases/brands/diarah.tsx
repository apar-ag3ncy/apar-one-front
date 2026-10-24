import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "diarah",
    eyebrow: "Featured client · Jewellery",
    title: <>Diarah</>,
    card: {
      name: "Diarah",
      cat: "Jewellery",
      blurb: "Luxury fine jewellery - refined rebrand and full-funnel digital campaigns.",
    },
    fonts: FONTS_DEFAULT,
    sub: "Luxury fine jewellery, refined for the modern collector - a deep, warm world of wine and champagne that signals quiet confidence.",
    theme: {
      bg: "#0B444A",
      bg2: "#1B6B74",
      ink: "#F3E4D6",
      soft: "rgba(243,228,214,.70)",
      accent: "#D9A679",
      accentSoft: "rgba(217,166,121,.18)",
      line: "rgba(243,228,214,.16)",
    },
    heroPlaceholder: "Drop Diarah hero image (wine/champagne)",
    meta: [
      { label: "Services", value: "Rebrand · Strategy · Digital" },
      { label: "Sector", value: "Luxury Jewellery" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Full-funnel" },
    ],
    brief: {
      lead: "Exceptional craftsmanship that read as ordinary online - luxury that wasn't being felt.",
      challenge:
        "Diarah's pieces were genuinely high-end, but the brand didn't carry that weight digitally. The goal: a rebrand that signalled luxury instantly, plus marketing that reached serious buyers without cheapening the name.",
      did: [
        "Refined rebrand - wine & champagne system",
        "Brand strategy & positioning",
        "Editorial campaign & AI content",
        "Full-funnel performance marketing",
      ],
    },
    approach: {
      lead: (
        <>
          Understated, warm and undeniably <em>luxe</em> - restraint that reads as confidence.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Editorial campaign", ratio: "16/11" },
        { cls: "tall", placeholder: "Product hero", ratio: "4/5" },
        { cls: "half", placeholder: "Identity detail", ratio: "5/4" },
        { cls: "half", placeholder: "Social / campaign", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 2.8, suffix: "×", label: "Qualified enquiries" },
      { n: 52, suffix: "%", label: "Higher avg. order value" },
      { n: 3.6, suffix: "×", label: "Campaign ROAS" },
    ],
    quote: {
      text: (
        <>
          &ldquo;For the first time, our marketing feels as <em>precious</em> as our
          jewellery.&rdquo;
        </>
      ),
      by: "Marketing Head - Diarah",
    },
    next: { kicker: "Next case", name: "Maison Mireyaa", href: "/work/maison-mireyaa", color: "#5F0627", ink: "#F5D0CE" },
  };

export default data;
