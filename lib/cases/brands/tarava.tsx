import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "tarava",
    eyebrow: "Featured client · Fine Silver",
    title: <>Tarava</>,
    card: {
      name: "Tarava",
      cat: "Fine Silver",
      blurb: "Fine silver jewellery with a soul - branding, content and campaigns as crafted as the pieces.",
    },
    fonts: FONTS_DEFAULT,
    sub: "A house of fine silver jewellery, rooted in heritage - given a deep, earthy brand world where every piece feels considered, sacred and quietly luxurious.",
    // Real Tarava mark (reclining bull + "TARAVA - Moments in Silver"), auto-loaded
    // from public/logos/tarava.png. Silver-on-maroon - no tint/invert needed.
    theme: {
      bg: "#520825",
      bg2: "#6E0B33",
      ink: "#CAC1B6",
      soft: "rgba(202,193,182,.72)",
      accent: "#CAC1B6",
      accentSoft: "rgba(202,193,182,.16)",
      line: "rgba(202,193,182,.20)",
    },
    heroPlaceholder: "Drop Tarava hero image (aubergine / silver)",
    meta: [
      { label: "Services", value: "Branding · Content · Campaigns" },
      { label: "Sector", value: "Fine Silver Jewellery" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "Soulful silver craft that read as ordinary online - heritage without a brand to carry it.",
      challenge:
        "Tarava needed an identity as considered and rooted as its silver - earthy, premium and quietly spiritual - with content and campaigns that drew collectors and gifting buyers alike.",
      did: [
        "Brand identity - aubergine & silver system",
        "Photography & content direction",
        "Always-on social calendar",
        "Performance campaigns for sales",
      ],
    },
    approach: {
      lead: (
        <>
          Earthy, sacred and quietly <em>luxurious</em> - silver framed with reverence.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Signature piece", ratio: "4/5" },
        { cls: "wide", placeholder: "Campaign key visual", ratio: "16/11" },
        { cls: "half", placeholder: "Product detail", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 3.1, suffix: "×", label: "Social engagement" },
      { n: 49, suffix: "%", label: "More enquiries" },
      { n: 2.4, suffix: "×", label: "Online sales" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our silver finally feels as <em>soulful</em> online as it does in person.&rdquo;
        </>
      ),
      by: "Founder - Tarava",
    },
    next: { kicker: "Back to", name: "All clients", href: "/clients", color: "#F4EDE2", ink: "#1A1714" },
  };

export default data;
