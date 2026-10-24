import type { CaseData } from "../types";
import { FONTS_GIRVAAN } from "../fonts";

const data: CaseData = {
    slug: "girvaan",
    eyebrow: "Featured client · Jewellery",
    title: <>Girvaan</>,
    card: {
      name: "Girvaan",
      cat: "Jewellery",
      blurb: "A modern jewellery label - brand identity, content engine and performance ads.",
    },
    logoInvert: true,
    fonts: FONTS_GIRVAAN,
    sub: "A modern jewellery label for a softer, contemporary buyer - built from a blush-and-white world that feels effortlessly elegant.",
    theme: {
      bg: "#985070",
      bg2: "#7d3f5c",
      ink: "#EDCEDD",
      soft: "rgba(237,206,221,.88)",
      accent: "#EDCEDD",
      accentSoft: "rgba(237,206,221,.16)",
      line: "rgba(237,206,221,.20)",
    },
    heroPlaceholder: "Girvaan · Gold bangle on a pink sculptural surface",
    meta: [
      { label: "Services", value: "Branding · Content · Performance" },
      { label: "Sector", value: "Jewellery" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "A beautiful product with no brand world to live in - and no consistent voice online.",
      challenge:
        "Girvaan needed to stand out in a crowded feed with a look that felt premium yet approachable. The pieces were lovely; the brand around them hadn't caught up.",
      did: [
        "Brand identity - blush & white system",
        "Photography & content direction",
        "Always-on social calendar",
        "Performance campaigns to drive sales",
      ],
    },
    approach: {
      lead: (
        <>
          Soft, modern and unmistakably <em>Girvaan</em> - a world as delicate as the jewellery.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Orchid ring · Floral composition", ratio: "3/4" },
        { cls: "tall", placeholder: "Lotus necklace · Amethyst palette", ratio: "3/4" },
        { cls: "tall", placeholder: "Petal bracelet · Pink editorial", ratio: "3/4" },
        { cls: "tall", placeholder: "Rose ring · Collection imagery", ratio: "3/4" },
        { cls: "tall", placeholder: "Peacock ring · Pink reflection", ratio: "3/4" },
        { cls: "tall", placeholder: "Sunburst ring · Product detail", ratio: "3/4" },
        { cls: "wide", placeholder: "Emerald earrings · Collection pair", ratio: "3/2" },
        { cls: "half", placeholder: "Emerald necklace · Fine silver collection", ratio: "1/1" },
        { cls: "tall", placeholder: "Hanuman Jayanti film", ratio: "4/5", video: "/videos/girvaan-hanuman-jayanti.mp4" },
      ],
    },
    stats: [
      { n: 4.2, suffix: "×", label: "Follower growth" },
      { n: 5.6, suffix: "×", label: "ROAS on campaigns" },
      { n: 40, suffix: "%", label: "Lower cost per sale" },
    ],
    quote: {
      text: (
        <>
          &ldquo;They gave our jewellery a world to <em>live in</em> - and it sells itself
          now.&rdquo;
        </>
      ),
      by: "Founder - Girvaan",
    },
    next: { kicker: "Next case", name: "Diarah", href: "/work/diarah", color: "#0B444A", ink: "#F3E4D6" },
  };

export default data;
