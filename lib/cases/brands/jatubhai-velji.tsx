import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "jatubhai-velji",
    eyebrow: "Featured client · Jewellery",
    title: <>Jatubhai Velji</>,
    card: {
      name: "Jatubhai Velji Jewellers",
      cat: "Jewellery",
      blurb: "Heritage jewellery with a warm, earthy soul - identity, content and campaigns that honour the legacy.",
    },
    logoInvert: true,
    fonts: FONTS_DEFAULT,
    sub: "A trusted jewellery name with deep roots - given a warm, terracotta-and-cream brand world that carries its heritage into a new generation.",
    theme: {
      bg: "#A0544A",
      bg2: "#B0685B",
      ink: "#F5EFE5",
      soft: "rgba(245,239,229,.88)",
      accent: "#F5EFE5",
      accentSoft: "rgba(245,239,229,.16)",
      line: "rgba(245,239,229,.20)",
    },
    heroPlaceholder: "Drop Jatubhai Velji hero image (terracotta / cream)",
    meta: [
      { label: "Services", value: "Branding · Social · Campaigns" },
      { label: "Sector", value: "Jewellery" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "A name families have trusted for generations - but a presence online that didn't carry that weight.",
      challenge:
        "Jatubhai Velji needed an identity as warm and dependable as its reputation - heritage made modern - with content and campaigns that reached the next generation without losing the old guard.",
      did: [
        "Brand identity - terracotta & cream system",
        "Festive & wedding-season campaigns",
        "Always-on social content",
        "Performance ads for store footfall",
      ],
    },
    approach: {
      lead: (
        <>
          Warm, rooted and quietly <em>proud</em> - heritage framed for a new generation of buyers.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Campaign key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Product / hero piece", ratio: "4/5" },
        { cls: "half", placeholder: "Festive / wedding creative", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 2.9, suffix: "×", label: "Social engagement" },
      { n: 54, suffix: "%", label: "More store enquiries" },
      { n: 2.3, suffix: "×", label: "Festive season sales" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our name finally looks online like it has always felt in <em>person</em>.&rdquo;
        </>
      ),
      by: "Director - Jatubhai Velji Jewellers",
    },
    next: { kicker: "Next case", name: "Signi", href: "/work/signi", color: "#3A2F7A", ink: "#EFEDFB" },
  };

export default data;
