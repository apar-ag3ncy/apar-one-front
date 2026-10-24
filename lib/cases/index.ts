import "server-only";
import type { CaseData, FeaturedClient } from "./types";
import chheda from "./brands/chheda";
import girvaan from "./brands/girvaan";
import diarah from "./brands/diarah";
import maisonMireyaa from "./brands/maison-mireyaa";
import achal from "./brands/achal";
import highOnSmiles from "./brands/high-on-smiles";
import silverEmporium from "./brands/silver-emporium";
import aParamount from "./brands/a-paramount";
import kundanJewellers from "./brands/kundan-jewellers";
import jatubhaiVelji from "./brands/jatubhai-velji";
import signi from "./brands/signi";
import tarava from "./brands/tarava";
import harshitGold from "./brands/harshit-gold";

// Ordered once for static routes, client cards and testimonials.
export const CASES: Record<string, CaseData> = {
  "chheda": chheda,
  "girvaan": girvaan,
  "diarah": diarah,
  "maison-mireyaa": maisonMireyaa,
  "achal": achal,
  "high-on-smiles": highOnSmiles,
  "silver-emporium": silverEmporium,
  "a-paramount": aParamount,
  "kundan-jewellers": kundanJewellers,
  "jatubhai-velji": jatubhaiVelji,
  "signi": signi,
  "tarava": tarava,
  "harshit-gold": harshitGold,
};

export const CASE_SLUGS = Object.keys(CASES);

/**
 * Single source of truth for the featured-client cards shown on the home page
 * and the clients page. Colours are pulled straight from each case `theme`, so
 * adding a new company = add one brand module to CASES above - nothing else to touch.
 */
export const FEATURED_CLIENTS: FeaturedClient[] = CASE_SLUGS.map((slug, idx) => {
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
