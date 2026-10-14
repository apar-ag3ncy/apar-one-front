export type BrandForm = "petal" | "facet" | "architecture" | "orbit";
export interface CaseMotionProfile {
  form: BrandForm;
  direction: number;
  bend: number;
  opening: string;
  cover?: string;
  /** Image-led stories centre each whole photograph before gently releasing it. */
  gallery?: { lift: number; tilt: number; restingScale: number; scrub: number };
}

/** Art direction belongs to the brand; timing/lifecycle belong to the shared components. */
const PROFILES: Record<string, CaseMotionProfile> = {
  chheda: { form: "petal", direction: 1, bend: .8, opening: "power3.out", cover: "/work/featured/chheda-banner.webp",
    gallery: { lift: 30, tilt: .65, restingScale: .965, scrub: .8 } },
  girvaan: { form: "petal", direction: -1, bend: .8, opening: "power2.out", cover: "/work/girvaan/curated/pink-bangle-hero.webp",
    gallery: { lift: 24, tilt: .45, restingScale: .975, scrub: .8 } },
  diarah: { form: "facet", direction: 1, bend: 1.4, opening: "power3.out" },
  "maison-mireyaa": { form: "petal", direction: -1, bend: 1.1, opening: "power2.out", cover: "/work/featured/mireyaa-botanical.webp" },
  achal: { form: "architecture", direction: 1, bend: .6, opening: "power3.out", cover: "/work/featured/achal-one-signage.webp" },
  "high-on-smiles": { form: "orbit", direction: -1, bend: .7, opening: "power2.out" },
  "silver-emporium": { form: "orbit", direction: 1, bend: 1, opening: "power3.out" },
  "a-paramount": { form: "architecture", direction: -1, bend: .35, opening: "power3.out", cover: "/work/featured/paramount-ceiling.webp",
    gallery: { lift: 20, tilt: 0, restingScale: .98, scrub: .75 } },
  "kundan-jewellers": { form: "petal", direction: 1, bend: .9, opening: "power2.out", cover: "/work/kundan-jewellers/curated/gold-pendant-hero.webp",
    gallery: { lift: 24, tilt: .35, restingScale: .975, scrub: .8 } },
  "harshit-gold": { form: "petal", direction: 1, bend: .65, opening: "power3.out", cover: "/work/harshit-gold/curated/campaign-portrait-hero.webp",
    gallery: { lift: 24, tilt: .35, restingScale: .975, scrub: .8 } },
  "jatubhai-velji": { form: "petal", direction: -1, bend: .75, opening: "power2.out" },
  signi: { form: "facet", direction: -1, bend: 1.5, opening: "power3.out", cover: "/work/signi/3.jpg" },
  tarava: { form: "orbit", direction: 1, bend: .85, opening: "power2.out" },
};

export function caseMotion(slug: string): CaseMotionProfile {
  return PROFILES[slug] ?? { form: "facet", direction: 1, bend: 1, opening: "power3.out" };
}

/** Supplied APAR artwork, never generated stand-ins for a client's project. */
export const CURATED_CASE_MEDIA: Record<string, { hero: string; photos: string[] }> = {
  girvaan: {
    hero: "/work/girvaan/curated/pink-bangle-hero.webp",
    photos: ["orchid-ring", "lotus-necklace", "petal-bracelet", "rose-ring", "peacock-ring", "sunburst-ring", "emerald-earrings", "emerald-necklace"]
      .map(name => `/work/girvaan/curated/${name}.webp`),
  },
  "kundan-jewellers": {
    hero: "/work/kundan-jewellers/curated/gold-pendant-hero.webp",
    photos: ["filigree-pendant", "triangle-pendant", "floral-set", "petal-set", "filigree-set", "ruby-flower-detail", "gold-earring-detail", "pendant-detail"]
      .map(name => `/work/kundan-jewellers/curated/${name}.webp`),
  },
  "harshit-gold": {
    hero: "/work/harshit-gold/curated/campaign-portrait-hero.webp",
    photos: ["polki-necklace", "gold-necklace", "peacock-ring", "floral-ring", "emerald-necklace", "ruby-ring", "gold-brooch", "medallion-set"]
      .map(name => `/work/harshit-gold/curated/${name}.webp`),
  },
  chheda: {
    hero: "/work/featured/chheda-banner.webp",
    photos: ["bridal-red", "bridal-veil", "diamond-editorial", "diamond-detail", "emerald-detail", "gold-editorial", "bridal-detail", "diamond-portrait"]
      .map(name => `/work/chheda/curated/${name}.webp`),
  },
  achal: {
    hero: "/work/featured/achal-one-signage.webp",
    photos: ["achal-one-interior", "achal-one-emblem", "achal-one-space", "achal-one-glass"].map(n => `/work/featured/${n}.webp`),
  },
  "a-paramount": {
    hero: "/work/featured/paramount-ceiling.webp",
    photos: ["inlay-entrance", "brass-emboss-door", "silver-bajot", "ornate-chattar", "ceremonial-rath", "pakshal-kalash", "shatrunjay-panel", "diya-sanctum"]
      .map(name => `/work/a-paramount/curated/${name}.webp`),
  },
  "maison-mireyaa": { hero: "/work/featured/mireyaa-botanical.webp", photos: [] },
};
