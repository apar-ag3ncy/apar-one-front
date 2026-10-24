import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "chheda",
    eyebrow: "Featured client · Jewellery",
    title: (
      <>
        Chheda <em>Jewellers</em>
      </>
    ),
    card: {
      name: "Chheda Jewellers",
      cat: "Jewellery",
      blurb: "Heritage gold & diamond house - identity, festive campaigns and social growth.",
    },
    fonts: FONTS_DEFAULT,
    sub: "A heritage gold & diamond house, reimagined for a new generation of buyers - without losing an ounce of its legacy.",
    theme: {
      bg: "#0a2a20",
      bg2: "#0f3d2e",
      ink: "#E9CE82",
      soft: "rgba(233,206,130,.72)",
      accent: "#D8B65B",
      accentSoft: "rgba(216,182,91,.18)",
      line: "rgba(244,233,200,.18)",
    },
    heroPlaceholder: "Chheda Jewellers — brand campaign",
    meta: [
      { label: "Services", value: "Branding · Social · Campaigns" },
      { label: "Sector", value: "Jewellery Retail" },
      { label: "Year", value: "2026" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "A trusted name for decades - but the brand looked the same as every other jeweller on the street.",
      challenge:
        "Chheda had loyalty and craftsmanship, but its identity didn't signal premium, and its social presence wasn't bringing younger buyers through the door. The festive season was being left on the table.",
      did: [
        "Refreshed identity - emerald & gold system",
        "Festive & wedding-season campaigns",
        "Always-on social content engine",
        "Performance ads for store footfall",
      ],
    },
    approach: {
      lead: (
        <>
          We made heritage feel <em>luxurious</em> again - gold on deep emerald, with stories worth
          sharing.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Bridal jewellery · Red editorial", ratio: "3/2" },
        { cls: "wide", placeholder: "Bridal jewellery · Through the veil", ratio: "3/2" },
        { cls: "wide", placeholder: "Diamond jewellery · Blue editorial", ratio: "3/2" },
        { cls: "tall", placeholder: "Diamond necklace · The details", ratio: "2/3" },
        { cls: "tall", placeholder: "Emerald jewellery · Close-up", ratio: "2/3" },
        { cls: "wide", placeholder: "Gold jewellery · Layered elegance", ratio: "3/2" },
        { cls: "tall", placeholder: "Bridal jewellery · Earring detail", ratio: "2/3" },
        { cls: "wide", placeholder: "Diamond jewellery · Portrait", ratio: "3/2" },
      ],
    },
    stats: [
      { n: 3.1, suffix: "×", label: "Social engagement" },
      { n: 68, suffix: "%", label: "More store enquiries" },
      { n: 2.4, suffix: "×", label: "Festive season sales" },
    ],
    quote: {
      text: (
        <>
          &ldquo;They made us look like the <em>landmark</em> we&apos;ve always been.&rdquo;
        </>
      ),
      by: "Director - Chheda Jewellers",
    },
    next: { kicker: "Next case", name: "Girvaan", href: "/work/girvaan", color: "#985070", ink: "#EDCEDD" },
  };

export default data;
