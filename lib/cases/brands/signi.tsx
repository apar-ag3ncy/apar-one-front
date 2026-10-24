import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "signi",
    eyebrow: "Featured client · Lab-Grown Gems",
    title: <>Signi</>,
    card: {
      name: "Signi",
      cat: "Lab-Grown Gems",
      blurb: "Sublime sparkles, grown not mined - branding, content and campaigns for a modern lab-grown gem house.",
    },
    fonts: FONTS_DEFAULT,
    sub: "Lab-grown diamonds and gems with a conscience - given a deep-indigo brand world that makes sustainable sparkle feel anything but a compromise.",
    // Signi mark (white, transparent) auto-loads from public/logos/signi.png -
    // white-on-indigo, no tint/invert needed.
    theme: {
      bg: "#3c3073",
      bg2: "#4D4090",
      ink: "#EFEDFB",
      soft: "rgba(239,237,251,.72)",
      accent: "#FFFFFF",
      accentSoft: "rgba(255,255,255,.16)",
      line: "rgba(239,237,251,.20)",
    },
    heroPlaceholder: "Signi - Mother's Day campaign model in lilac",
    meta: [
      { label: "Services", value: "Branding · Content · Performance" },
      { label: "Sector", value: "Lab-Grown Gems" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "Stunning lab-grown stones fighting an old perception - real sparkle that buyers didn't yet trust.",
      challenge:
        "Signi needed a brand that made lab-grown feel premium and aspirational, not second-best - with content that educated and campaigns that turned curiosity into confident purchases.",
      did: [
        "Brand identity - deep-indigo sparkle system",
        "Education-led social content",
        "Launch & always-on campaigns",
        "Performance marketing for online sales",
      ],
    },
    approach: {
      lead: (
        <>
          Modern, brilliant and unapologetically <em>conscious</em> - sparkle with a clear conscience.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Signi - model portrait with diamond earrings", ratio: "4/5" },
        { cls: "tall", placeholder: "Signi - model wearing diamond rings", ratio: "4/5" },
        { cls: "tall", placeholder: "Signi - diamond pendant detail", ratio: "4/5" },
        { cls: "tall", placeholder: "Signi - layered diamond jewellery on model", ratio: "4/5" },
      ],
    },
    stats: [
      { n: 4.4, suffix: "×", label: "Follower growth" },
      { n: 5.1, suffix: "×", label: "ROAS on campaigns" },
      { n: 43, suffix: "%", label: "Lower cost per sale" },
    ],
    quote: {
      text: (
        <>
          &ldquo;People finally see lab-grown as the <em>future</em> - and they buy with confidence.&rdquo;
        </>
      ),
      by: "Founder - Signi",
    },
    next: { kicker: "Next case", name: "Tarava", href: "/work/tarava", color: "#2A0E1E", ink: "#CAC1B6" },
  };

export default data;
