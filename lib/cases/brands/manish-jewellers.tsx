import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
  slug: "manish-jewellers",
  title: <>Manish <em>Jewellers</em></>,
  eyebrow: "Client story · Jewellery",
  card: { name: "Manish Jewellers", cat: "Jewellery · Since 1916", blurb: "A rose-gold identity, bridal portraits and an intimate study of coloured gemstones." },
  logo: "/brands/manish-jewellers/lockup-compact.png",
  fonts: FONTS_DEFAULT,
  sub: "From a signature in rose gold to the smallest gemstone setting. A visual story of portraits, precious details and jewellery made to be remembered.",
  theme: {
    bg: "#793f48", bg2: "#48252d", ink: "#fff4ed", soft: "#ead5cf",
    accent: "#e8c1ae", accentSoft: "rgba(232,193,174,.18)", line: "rgba(255,244,237,.22)",
  },
  heroPlaceholder: "Manish Jewellers · Blue gemstone portrait",
  meta: [
    { label: "Work", value: "Brand identity · Collection imagery" },
    { label: "Sector", value: "Fine jewellery" },
    { label: "Palette", value: "Wine · Rose gold" },
    { label: "Focus", value: "Portraits · Product details" },
  ],
  brief: {
    lead: <>A familiar signature. A closer look at the <em>extraordinary.</em></>,
    challenge: "Bring the identity, bridal imagery and gemstone details into one coherent visual story, giving each piece the space to be seen.",
    did: ["Wine and rose-gold identity presentation", "Bridal and gemstone portrait compositions", "Close studies of necklaces and earrings", "Collection pairings across portrait and product imagery"],
  },
  approach: {
    lead: <>The signature.<br />The silhouette.<br /><em>The smallest detail.</em></>,
    gallery: [
      { cls: "wide", placeholder: "The signature · Rose-gold monogram on wine", ratio: "75/56" },
      { cls: "wide", placeholder: "Together in crimson · Bridal campaign", ratio: "200/99" },
      { cls: "wide", placeholder: "Gold in bloom · Bridal portrait", ratio: "1532/1027" },
      { cls: "wide", placeholder: "Blue and violet · Necklace detail", ratio: "1374/1145" },
      { cls: "tall", placeholder: "The finishing touch · Blue gemstone earrings", ratio: "561/701" },
      { cls: "tall", placeholder: "A study in ruby · Necklace portrait", ratio: "561/701" },
      { cls: "tall", placeholder: "Crimson drops · Worn in the light", ratio: "561/701" },
      { cls: "tall", placeholder: "The fan necklace · Full composition", ratio: "1124/1399" },
      { cls: "tall", placeholder: "Crimson earrings · Paired in silk", ratio: "1124/1399" },
    ],
  },
  stats: [],
  resultsLabel: "The collection story",
  resultsNote: <>Portraits set the mood. Close details reveal the character. The same warm light connects <em>every frame.</em></>,
  quote: { text: <>Crafted through <em>generations.</em></>, by: "Manish Jewellers · Campaign line" },
  next: { kicker: "Discover more", name: "Our clients", href: "/clients", color: "#793f48", ink: "#fff4ed" },
};

export default data;
