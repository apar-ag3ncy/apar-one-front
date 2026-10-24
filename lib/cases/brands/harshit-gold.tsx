import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "harshit-gold",
    eyebrow: "Featured client · Jewellery",
    title: <>Harshit <em>Gold</em></>,
    card: { name: "Harshit Gold", cat: "Jewellery", blurb: "Gold and gemstone collections, brought together through olive-silk compositions and campaign artwork." },
    logo: "/logos/harshit-gold.svg",
    fonts: FONTS_DEFAULT,
    sub: "Gold, gemstones and a world of olive silk — a collection story built around the colour, detail and character of each piece.",
    theme: {
      bg: "#383C23", bg2: "#252918", ink: "#F4D9BD", soft: "rgba(244,217,189,.78)",
      accent: "#DDC299", accentSoft: "rgba(221,194,153,.18)", line: "rgba(244,217,189,.20)",
    },
    heroPlaceholder: "Harshit Gold · Olive-silk campaign portrait",
    meta: [
      { label: "Work", value: "Collection imagery · Campaign artwork" },
      { label: "Sector", value: "Jewellery" },
      { label: "Palette", value: "Olive · Champagne gold" },
      { label: "Focus", value: "Gold · Gemstones · Detail" },
    ],
    brief: {
      lead: <>Let the jewellery lead, with a visual world that makes every <em>detail belong.</em></>,
      challenge: "Give varied gold and gemstone pieces a coherent presentation while keeping their individual shapes, settings and colours clearly visible.",
      did: ["Olive-silk collection compositions", "Product portraits and jewellery details", "Campaign portrait and print artwork", "Consistent colour and visual language"],
    },
    approach: {
      lead: <>A quiet olive backdrop. Warm gold. A closer look at the <em>craft.</em></>,
      gallery: [
        { cls: "tall", placeholder: "Polki necklace · Olive-silk collection", ratio: "18/25" },
        { cls: "tall", placeholder: "Gold necklace · Matching earrings", ratio: "18/25" },
        { cls: "tall", placeholder: "Peacock ring · Gemstone detail", ratio: "18/25" },
        { cls: "tall", placeholder: "Floral ring · Collection composition", ratio: "18/25" },
        { cls: "tall", placeholder: "Emerald necklace · Olive-silk collection", ratio: "18/25" },
        { cls: "tall", placeholder: "Ruby ring · Sculptural detail", ratio: "18/25" },
        { cls: "tall", placeholder: "Gold brooch · Collection detail", ratio: "18/25" },
        { cls: "tall", placeholder: "Medallion set · Matching earrings", ratio: "18/25" },
      ],
    },
    stats: [],
    resultsLabel: "The visual world",
    resultsNote: <>One cohesive palette, with room for every piece to have its own <em>character.</em> From full collection compositions to close details, the jewellery stays the focus.</>,
    quote: { text: <>Effortless <em>elegance.</em><br />Timeless you.</>, by: "Harshit Gold · Campaign line" },
    next: { kicker: "Next case", name: "Jatubhai Velji", href: "/work/jatubhai-velji", color: "#A0544A", ink: "#F5EFE5" },
  };

export default data;
