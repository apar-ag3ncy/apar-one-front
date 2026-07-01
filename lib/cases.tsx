import type { CaseData, CaseFonts } from "@/components/case-study";

// ── Per-company typography ──────────────────────────────────────────────────
// Each company gets its own stack. FONTS_DEFAULT matches the site-wide look
// (Newsreader + Archivo); add a new const per company that wants custom fonts.
const FONTS_DEFAULT: CaseFonts = {
  serif: "'Newsreader',Georgia,serif",
  sans: "'Archivo',system-ui,sans-serif",
};
const FONTS_GIRVAAN: CaseFonts = {
  serif: "'Bodoni 72','Bodoni Moda','Didot',Georgia,serif",
  sans: "'Optima','Optima Nova','Candara','Segoe UI',system-ui,sans-serif",
};
// Florentia + Balham aren't system/web fonts yet - they fall back to Bodoni 72
// (installed) / system sans until their font files are loaded via @font-face.
const FONTS_MAISON: CaseFonts = {
  serif: "'Florentia','Bodoni 72','Bodoni Moda','Didot',Georgia,serif",
  sans: "'Balham','Optima','Candara','Segoe UI',system-ui,sans-serif",
};
// Blisstwin isn't a system/web font yet - display falls back to Newsreader
// until its font file is loaded via @font-face. Body keeps the site sans.
const FONTS_ACHAL: CaseFonts = {
  serif: "'Blisstwin','Newsreader',Georgia,serif",
  sans: "'Archivo',system-ui,sans-serif",
};

export const CASES: Record<string, CaseData> = {
  chheda: {
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
    heroPlaceholder: "Drop Chheda hero image (gold/emerald)",
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
      by: "Director - Chheda Jewellers",
    },
    next: { kicker: "Next case", name: "Girvaan", href: "/work/girvaan", color: "#985070", ink: "#EDCEDD" },
  },

  girvaan: {
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
      soft: "rgba(237,206,221,.72)",
      accent: "#EDCEDD",
      accentSoft: "rgba(237,206,221,.16)",
      line: "rgba(237,206,221,.20)",
    },
    heroPlaceholder: "Drop Girvaan hero image (blush/white)",
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
        { cls: "tall", placeholder: "Campaign portrait", ratio: "4/5" },
        { cls: "wide", placeholder: "Social grid / key visual", ratio: "16/11" },
        { cls: "half", placeholder: "Product detail", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
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
  },

  diarah: {
    slug: "diarah",
    eyebrow: "Featured client · Jewellery",
    title: <>Diarah</>,
    card: {
      name: "Diarah",
      cat: "Jewellery",
      blurb: "Luxury fine jewellery - refined rebrand and full-funnel digital campaigns.",
    },
    fonts: FONTS_DEFAULT,
    sub: "Luxury fine jewellery, refined for the modern collector - a deep, warm world of wine and champagne that signals quiet confidence.",
    theme: {
      bg: "#0B444A",
      bg2: "#1B6B74",
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
      lead: "Exceptional craftsmanship that read as ordinary online - luxury that wasn't being felt.",
      challenge:
        "Diarah's pieces were genuinely high-end, but the brand didn't carry that weight digitally. The goal: a rebrand that signalled luxury instantly, plus marketing that reached serious buyers without cheapening the name.",
      did: [
        "Refined rebrand - wine & champagne system",
        "Brand strategy & positioning",
        "Editorial campaign & AI content",
        "Full-funnel performance marketing",
      ],
    },
    approach: {
      lead: (
        <>
          Understated, warm and undeniably <em>luxe</em> - restraint that reads as confidence.
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
      by: "Marketing Head - Diarah",
    },
    next: { kicker: "Next case", name: "Maison Mireyaa", href: "/work/maison-mireyaa", color: "#5F0627", ink: "#F5D0CE" },
  },

  "maison-mireyaa": {
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
  },

  achal: {
    slug: "achal",
    eyebrow: "Featured client · Real Estate",
    title: <>Achal</>,
    card: {
      name: "Achal",
      cat: "Real Estate",
      blurb: "Where address becomes aspiration - branding, content and campaigns for premium real estate.",
    },
    logoTint: "#C9A062",
    fonts: FONTS_ACHAL,
    sub: "Premium real estate, positioned with confidence - a navy world that makes an address feel like a landmark.",
    theme: {
      bg: "#2A3B59",
      bg2: "#38507A",
      ink: "#DCE4F2",
      soft: "rgba(220,228,242,.72)",
      accent: "#DCE4F2",
      accentSoft: "rgba(220,228,242,.16)",
      line: "rgba(220,228,242,.20)",
    },
    heroPlaceholder: "Drop Achal hero image (navy / architectural)",
    meta: [
      { label: "Services", value: "Branding · Content · Campaigns" },
      { label: "Sector", value: "Real Estate" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project + retainer" },
    ],
    brief: {
      lead: "Landmark projects that read as ordinary listings - premium real estate without a premium brand.",
      challenge:
        "Achal needed a brand as considered as its developments - one that signalled trust and aspiration to serious buyers, with marketing that filled site visits and turned interest into bookings.",
      did: [
        "Brand identity - navy & light system",
        "Project launch campaigns",
        "Always-on social & content",
        "Performance marketing for site visits",
      ],
    },
    approach: {
      lead: (
        <>
          Confident, architectural and quietly <em>premium</em> - a brand that makes an address aspirational.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Project key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Tower / elevation", ratio: "4/5" },
        { cls: "half", placeholder: "Brochure / identity", ratio: "5/4" },
        { cls: "half", placeholder: "Social / campaign", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 2.9, suffix: "×", label: "Qualified site visits" },
      { n: 38, suffix: "%", label: "Lower cost per lead" },
      { n: 3.3, suffix: "×", label: "Campaign ROAS" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Our projects finally feel like the <em>landmarks</em> they are.&rdquo;
        </>
      ),
      by: "Director - Achal",
    },
    next: { kicker: "Next case", name: "High on Smiles", href: "/work/high-on-smiles", color: "#4A80C6", ink: "#FFFFFF" },
  },

  "high-on-smiles": {
    slug: "high-on-smiles",
    eyebrow: "Featured client · Dental Clinic",
    title: <>High on Smiles</>,
    card: {
      name: "High on Smiles",
      cat: "Dental",
      blurb: "Smiles worth showing off - brand, content and campaigns for a modern dental clinic.",
    },
    logoInvert: true,
    fonts: FONTS_DEFAULT,
    sub: "A modern dental clinic, made approachable - a bright, clean world that turns nervous first-timers into loyal, smiling regulars.",
    theme: {
      bg: "#4A80C6",
      bg2: "#5E91D2",
      ink: "#FFFFFF",
      soft: "rgba(255,255,255,.86)",
      accent: "#FFFFFF",
      accentSoft: "rgba(255,255,255,.18)",
      line: "rgba(255,255,255,.26)",
    },
    heroPlaceholder: "Drop High on Smiles hero image (bright / clinical)",
    meta: [
      { label: "Services", value: "Branding · Social · Performance" },
      { label: "Sector", value: "Dental · Healthcare" },
      { label: "Year", value: "2024" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "Great dentistry hidden behind a clinical, forgettable brand - and a feed that didn't build trust.",
      challenge:
        "High on Smiles needed to feel warm, modern and reassuring - a brand that eased anxiety and made booking effortless, with content and ads that filled the appointment book.",
      did: [
        "Friendly brand identity - bright & clean",
        "Patient-education social content",
        "Reviews & reputation building",
        "Performance ads for appointments",
      ],
    },
    approach: {
      lead: (
        <>
          Bright, warm and reassuring - a clinic that feels more <em>welcome</em> than waiting room.
        </>
      ),
      gallery: [
        { cls: "tall", placeholder: "Smiling patient portrait", ratio: "4/5" },
        { cls: "wide", placeholder: "Clinic / brand key visual", ratio: "16/11" },
        { cls: "half", placeholder: "Social / education post", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / signage", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 3.7, suffix: "×", label: "Appointment enquiries" },
      { n: 64, suffix: "%", label: "More new patients" },
      { n: 4.8, suffix: "★", label: "Average review score" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Patients walk in already <em>smiling</em> - they feel like they know us.&rdquo;
        </>
      ),
      by: "Founder - High on Smiles",
    },
    next: { kicker: "Next case", name: "Silver Emporium", href: "/work/silver-emporium", color: "#11294A", ink: "#E5EAF2" },
  },

  "silver-emporium": {
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
  },

  "a-paramount": {
    slug: "a-paramount",
    eyebrow: "Featured client · Engineering",
    title: <>A Paramount</>,
    card: {
      name: "A Paramount",
      cat: "Engineering",
      blurb: "Engineered to exacting standards - branding, website and lead generation for an engineering works.",
    },
    fonts: FONTS_DEFAULT,
    sub: "An engineering works built on precision - given a brand and digital presence as solid and exacting as its output.",
    theme: {
      bg: "#181712",
      bg2: "#262318",
      ink: "#ECE6D6",
      soft: "rgba(236,230,214,.70)",
      accent: "#A28E4F",
      accentSoft: "rgba(162,142,79,.20)",
      line: "rgba(236,230,214,.16)",
    },
    heroPlaceholder: "Drop A Paramount hero image (industrial / gold on dark)",
    meta: [
      { label: "Services", value: "Branding · Website · Lead Gen" },
      { label: "Sector", value: "Engineering · Manufacturing" },
      { label: "Year", value: "2025" },
      { label: "Engagement", value: "Project" },
    ],
    brief: {
      lead: "World-class engineering hidden behind a dated brand and an all-but-invisible web presence.",
      challenge:
        "A Paramount needed to look as precise and dependable as its work - a brand and website that earned trust with serious B2B buyers, plus a steady pipeline of qualified enquiries.",
      did: [
        "Brand identity - industrial & refined",
        "Website & technical content",
        "Lead-generation campaigns",
        "Company profile & catalogue design",
      ],
    },
    approach: {
      lead: (
        <>
          Solid, precise and quietly <em>premium</em> - engineering presented with the confidence it earns.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Facility / machinery key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Product / component", ratio: "4/5" },
        { cls: "half", placeholder: "Website / catalogue", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / signage", ratio: "5/4" },
      ],
    },
    stats: [
      { n: 3.2, suffix: "×", label: "Qualified enquiries" },
      { n: 48, suffix: "%", label: "Lower cost per lead" },
      { n: 2.5, suffix: "×", label: "Website conversions" },
    ],
    quote: {
      text: (
        <>
          &ldquo;We finally look like the <em>precision</em> house we are.&rdquo;
        </>
      ),
      by: "Director - A Paramount",
    },
    next: { kicker: "Next case", name: "Kundan Jewellers", href: "/work/kundan-jewellers", color: "#34251A", ink: "#EBDFCD" },
  },

  "kundan-jewellers": {
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
    heroPlaceholder: "Drop Kundan Jewellers hero image (warm brown / gold)",
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
        { cls: "wide", placeholder: "Campaign key visual", ratio: "16/11" },
        { cls: "tall", placeholder: "Product / hero piece", ratio: "4/5" },
        { cls: "half", placeholder: "Festive / wedding creative", ratio: "5/4" },
        { cls: "half", placeholder: "Identity / packaging", ratio: "5/4" },
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
    next: { kicker: "Next case", name: "Jatubhai Velji", href: "/work/jatubhai-velji", color: "#A0544A", ink: "#F5EFE5" },
  },

  "jatubhai-velji": {
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
      soft: "rgba(245,239,229,.72)",
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
  },

  signi: {
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
  },

  tarava: {
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
  },
};

export const CASE_SLUGS = Object.keys(CASES);

/**
 * Single source of truth for the featured-client cards shown on the home page
 * and the clients page. Colours are pulled straight from each case `theme`, so
 * adding a new company = add one entry to CASES above - nothing else to touch.
 */
export const FEATURED_CLIENTS = CASE_SLUGS.map((slug, idx) => {
  const c = CASES[slug];
  return {
    slug,
    href: `/work/${slug}`,
    i: String(idx + 1).padStart(2, "0"),
    cat: c.card.cat,
    name: c.card.name,
    blurb: c.card.blurb,
    // Auto-derived: drop /public/logos/<slug>.png and it appears on the card;
    // a case can override via its own `logo` field. Missing files fall back to the name.
    logo: c.logo ?? `/logos/${slug}.png`,
    logoInvert: c.logoInvert ?? false,
    logoTint: c.logoTint,
    year: c.meta.find((m) => m.label === "Year")?.value ?? "",
    theme: c.theme,
    fonts: c.fonts,
  };
});

export type FeaturedClient = (typeof FEATURED_CLIENTS)[number];

/** CSS custom properties that theme a `.fc-card` - colours + fonts from a case. */
export function featuredCardVars(c: {
  theme: CaseData["theme"];
  fonts: CaseFonts;
}): React.CSSProperties {
  return {
    "--fc-bg": c.theme.bg,
    "--fc-bg2": c.theme.bg2,
    "--fc-ink": c.theme.ink,
    "--fc-accent": c.theme.accent,
    "--serif": c.fonts.serif,
    "--sans": c.fonts.sans,
  } as React.CSSProperties;
}
