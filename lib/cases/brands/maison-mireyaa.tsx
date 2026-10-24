import type { CaseData } from "../types";
import { FONTS_MAISON } from "../fonts";

const data: CaseData = {
    slug: "maison-mireyaa",
    eyebrow: "Featured client · Florist",
    title: <>Maison Mireyaa</>,
    card: {
      name: "Maison Mireyaa",
      cat: "Florist",
      blurb: "Where every bloom tells a story - branding, seasonal content and campaigns for an atelier florist.",
    },
    fonts: FONTS_MAISON,
    sub: "An atelier of seasonal flowers, composed like couture - given a brand world as romantic and considered as its bouquets.",
    theme: {
      bg: "#5F0627",
      bg2: "#8B0939",
      ink: "#F5D0CE",
      soft: "rgba(245,208,206,.72)",
      accent: "#F5D0CE",
      accentSoft: "rgba(245,208,206,.16)",
      line: "rgba(245,208,206,.20)",
    },
    heroPlaceholder: "Maison Mireyaa - signature blush & wine bouquet",
    meta: [
      { label: "Services", value: "Branding · Content · Campaigns" },
      { label: "Sector", value: "Florist · Lifestyle" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "Beautiful flowers with no brand world to hold them - and a feed that didn't feel like the atelier.",
      challenge:
        "Maison Mireyaa needed an identity as romantic and considered as its arrangements - premium, seasonal and unmistakably theirs - with content that turned admirers into regulars and occasions into orders.",
      did: [
        "Brand identity - blush & wine system",
        "Seasonal photography & content direction",
        "Always-on social calendar",
        "Occasion-led performance campaigns",
      ],
    },
    approach: {
      lead: (
        <>
          Romantic, seasonal and quietly <em>luxurious</em> - a world as composed as the bouquets.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Maison Mireyaa - blush rose arrangement", ratio: "4/5" },
        { cls: "tall", placeholder: "Maison Mireyaa - anemone basket campaign", ratio: "1/1" },
        { cls: "tall", placeholder: "Maison Mireyaa - signature bouquet", ratio: "4/5" },
        { cls: "tall", placeholder: "Maison Mireyaa - Blooming Soon campaign", ratio: "4/5" },
        { cls: "tall", placeholder: "Maison Mireyaa - sunflower campaign", ratio: "2/3" },
        { cls: "tall", placeholder: "Maison Mireyaa - seasonal arrangement", ratio: "4/5" },
        { cls: "tall", placeholder: "Maison Mireyaa - hand-tied bouquet", ratio: "5/7" },
        { cls: "tall", placeholder: "Maison Mireyaa - Crafted with intention", ratio: "4/5" },
      ],
    },
    stats: [
      { n: 3.4, suffix: "×", label: "Social engagement" },
      { n: 2.7, suffix: "×", label: "Bouquet orders" },
      { n: 46, suffix: "%", label: "More occasion bookings" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our brand finally feels as <em>considered</em> as our flowers.&rdquo;
        </>
      ),
      by: "Founder - Maison Mireyaa",
    },
    next: { kicker: "Next case", name: "Achal", href: "/work/achal", color: "#2A3B59", ink: "#DCE4F2" },
  };

export default data;
