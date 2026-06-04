import type { CaseData } from "@/components/case-study";

export const CASES: Record<string, CaseData> = {
  chheda: {
    slug: "chheda",
    eyebrow: "Featured client · Jewellery",
    title: (
      <>
        Chheda <em>Jewellers</em>
      </>
    ),
    sub: "A heritage gold & diamond house, reimagined for a new generation of buyers — without losing an ounce of its legacy.",
    theme: {
      bg: "#0a2a20",
      bg2: "#0f3d2e",
      ink: "#F4E9C8",
      soft: "rgba(244,233,200,.70)",
      accent: "#D8B65B",
      accentSoft: "rgba(216,182,91,.18)",
      line: "rgba(244,233,200,.18)",
    },
    heroPlaceholder: "Drop Chheda hero image (gold/emerald)",
    meta: [
      { label: "Services", value: "Branding · Social · Campaigns" },
      { label: "Sector", value: "Jewellery Retail" },
      { label: "Year", value: "2026" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "A trusted name for decades — but the brand looked the same as every other jeweller on the street.",
      challenge:
        "Chheda had loyalty and craftsmanship, but its identity didn't signal premium, and its social presence wasn't bringing younger buyers through the door. The festive season was being left on the table.",
      did: [
        "Refreshed identity — emerald & gold system",
        "Festive & wedding-season campaigns",
        "Always-on social content engine",
        "Performance ads for store footfall",
      ],
    },
    approach: {
      lead: (
        <>
          We made heritage feel <em>luxurious</em> again — gold on deep emerald, with stories worth
          sharing.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Campaign key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Product / social post", ratio: "4/5" },
        { cls: "half", placeholder: "Festive creative", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
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
      by: "Director — Chheda Jewellers",
    },
    next: { kicker: "Next case", name: "Girvaan", href: "/work/girvaan", color: "#fbe9ee", ink: "#8d2f54" },
  },

  girvaan: {
    slug: "girvaan",
    eyebrow: "Featured client · Jewellery",
    title: <>Girvaan</>,
    sub: "A modern jewellery label for a softer, contemporary buyer — built from a blush-and-white world that feels effortlessly elegant.",
    theme: {
      bg: "#fbe9ee",
      bg2: "#ffffff",
      ink: "#5a2238",
      soft: "rgba(90,34,56,.66)",
      accent: "#b14e72",
      accentSoft: "rgba(177,78,114,.16)",
      line: "rgba(90,34,56,.16)",
    },
    heroPlaceholder: "Drop Girvaan hero image (blush/white)",
    meta: [
      { label: "Services", value: "Branding · Content · Performance" },
      { label: "Sector", value: "Jewellery" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "A beautiful product with no brand world to live in — and no consistent voice online.",
      challenge:
        "Girvaan needed to stand out in a crowded feed with a look that felt premium yet approachable. The pieces were lovely; the brand around them hadn't caught up.",
      did: [
        "Brand identity — blush & white system",
        "Photography & content direction",
        "Always-on social calendar",
        "Performance campaigns to drive sales",
      ],
    },
    approach: {
      lead: (
        <>
          Soft, modern and unmistakably <em>Girvaan</em> — a world as delicate as the jewellery.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Campaign portrait", ratio: "4/5" },
        { cls: "wide", placeholder: "Social grid / key visual", ratio: "16/11" },
        { cls: "half", placeholder: "Product detail", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
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
          &ldquo;They gave our jewellery a world to <em>live in</em> — and it sells itself
          now.&rdquo;
        </>
      ),
      by: "Founder — Girvaan",
    },
    next: { kicker: "Next case", name: "Diarah", href: "/work/diarah", color: "#2a0c16", ink: "#EBC79E" },
  },

  diarah: {
    slug: "diarah",
    eyebrow: "Featured client · Jewellery",
    title: <>Diarah</>,
    sub: "Luxury fine jewellery, refined for the modern collector — a deep, warm world of wine and champagne that signals quiet confidence.",
    theme: {
      bg: "#2a0c16",
      bg2: "#3a121f",
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
      lead: "Exceptional craftsmanship that read as ordinary online — luxury that wasn't being felt.",
      challenge:
        "Diarah's pieces were genuinely high-end, but the brand didn't carry that weight digitally. The goal: a rebrand that signalled luxury instantly, plus marketing that reached serious buyers without cheapening the name.",
      did: [
        "Refined rebrand — wine & champagne system",
        "Brand strategy & positioning",
        "Editorial campaign & AI content",
        "Full-funnel performance marketing",
      ],
    },
    approach: {
      lead: (
        <>
          Understated, warm and undeniably <em>luxe</em> — restraint that reads as confidence.
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
      by: "Marketing Head — Diarah",
    },
    next: { kicker: "Back to", name: "All clients", href: "/clients", color: "#F4EDE2", ink: "#1A1714" },
  },
};

export const CASE_SLUGS = Object.keys(CASES);
