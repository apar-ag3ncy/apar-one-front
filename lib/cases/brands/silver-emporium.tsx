import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "silver-emporium",
    eyebrow: "Featured client · Silver",
    title: <>Silver Emporium</>,
    card: {
      name: "Silver Emporium",
      cat: "Silver",
      blurb: "Silver worth passing down - branding, content and campaigns for a heritage silver house.",
    },
    logoInvert: true,
    fonts: FONTS_DEFAULT,
    sub: "A house of fine silver articles, made to be lived with - a cool, polished world that turns everyday silver into heirlooms.",
    theme: {
      bg: "#11294A",
      bg2: "#193B6B",
      ink: "#E5EAF2",
      soft: "rgba(229,234,242,.72)",
      accent: "#E5EAF2",
      accentSoft: "rgba(229,234,242,.16)",
      line: "rgba(229,234,242,.20)",
    },
    heroPlaceholder: "Drop Silver Emporium hero image (polished silver / navy)",
    meta: [
      { label: "Services", value: "Branding · Content · Campaigns" },
      { label: "Sector", value: "Silver Articles" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "Exquisite silver that looked like everyone else's online - craft without a brand to carry it.",
      challenge:
        "Silver Emporium needed an identity as refined as its pieces - cool, premium and timeless - with content and campaigns that brought gifting buyers and collectors through the door, festive season included.",
      did: [
        "Brand identity - navy & silver system",
        "Festive & gifting campaigns",
        "Always-on social content",
        "Performance ads for footfall & enquiries",
      ],
    },
    approach: {
      lead: (
        <>
          Cool, polished and quietly <em>timeless</em> - silver framed like the heirloom it becomes.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Silver collection key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Product / hero piece", ratio: "4/5" },
        { cls: "half", placeholder: "Festive / gifting creative", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 3.0, suffix: "×", label: "Social engagement" },
      { n: 57, suffix: "%", label: "More gifting enquiries" },
      { n: 2.6, suffix: "×", label: "Festive season sales" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our silver finally looks as <em>precious</em> online as it does in hand.&rdquo;
        </>
      ),
      by: "Director - Silver Emporium",
    },
    next: { kicker: "Next case", name: "A Paramount", href: "/work/a-paramount", color: "#181712", ink: "#ECE6D6" },
  };

export default data;
