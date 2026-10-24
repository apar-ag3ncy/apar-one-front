import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "kundan-jewellers",
    eyebrow: "Featured client · Jewellery",
    title: <>Kundan Jewellers</>,
    card: {
      name: "Kundan Jewellers",
      cat: "Jewellery",
      blurb: "Timeless gold & kundan jewellery - identity, content and campaigns with a warm, modern glow.",
    },
    fonts: FONTS_DEFAULT,
    sub: "A jewellery house of warm gold and kundan craft - given a soft, modern brand world as refined as its pieces.",
    theme: {
      bg: "#34251A",
      bg2: "#473322",
      ink: "#EBDFCD",
      soft: "rgba(235,223,205,.70)",
      accent: "#C9A062",
      accentSoft: "rgba(201,160,98,.18)",
      line: "rgba(235,223,205,.18)",
    },
    heroPlaceholder: "Kundan Jewellers · Gold pendant and matching earrings",
    meta: [
      { label: "Services", value: "Branding · Social · Campaigns" },
      { label: "Sector", value: "Jewellery" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "Exquisite gold and kundan work that looked ordinary in a crowded feed - craft without a brand to carry it.",
      challenge:
        "Kundan Jewellers needed a warm, modern identity that felt premium yet approachable, with content and campaigns that brought festive and wedding buyers through the door.",
      did: [
        "Brand identity - warm gold & cream system",
        "Festive & wedding-season campaigns",
        "Always-on social content",
        "Performance ads for footfall & enquiries",
      ],
    },
    approach: {
      lead: (
        <>
          Warm, modern and quietly <em>luxe</em> - gold craft framed in a soft, contemporary world.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Filigree pendant · Matching earrings", ratio: "3/4" },
        { cls: "tall", placeholder: "Triangular pendant · Gold collection", ratio: "3/4" },
        { cls: "tall", placeholder: "Floral set · Ruby accent", ratio: "3/4" },
        { cls: "tall", placeholder: "Petal set · Gold craftsmanship", ratio: "3/4" },
        { cls: "tall", placeholder: "Filigree set · Jewellery portrait", ratio: "3/4" },
        { cls: "half", placeholder: "Ruby flower · Product detail", ratio: "1/1" },
        { cls: "tall", placeholder: "Gold earring · Filigree detail", ratio: "3/5" },
        { cls: "tall", placeholder: "Pendant · Gold detail", ratio: "4/5" },
      ],
    },
    stats: [
      { n: 3.3, suffix: "×", label: "Social engagement" },
      { n: 61, suffix: "%", label: "More store enquiries" },
      { n: 2.5, suffix: "×", label: "Festive season sales" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our jewellery finally has the <em>warmth</em> online that people feel in store.&rdquo;
        </>
      ),
      by: "Director - Kundan Jewellers",
    },
    next: { kicker: "Next case", name: "Harshit Gold", href: "/work/harshit-gold", color: "#383C23", ink: "#F4D9BD" },
  };

export default data;
