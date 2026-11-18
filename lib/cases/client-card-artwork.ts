import "server-only";

export interface ClientCardArtwork {
  src: string;
  srcSet: string;
  ratio: string;
  alt: string;
  /** Display crop for white margins baked into a supplied screenshot. */
  bleed: string;
}

/** Supplied client-card artwork, kept separate from case heroes and the landing page. */
function artwork(slug: string, widths: number[], ratio: string, alt: string, bleed = "0%"): ClientCardArtwork {
  const path = (width: number) => `/work/client-cards/${slug}-${width}.webp`;
  return {
    src: path(widths[widths.length - 1]),
    srcSet: widths.map(width => `${path(width)} ${width}w`).join(", "),
    ratio,
    alt,
    bleed,
  };
}

export const CLIENT_CARD_ARTWORK: Record<string, ClientCardArtwork> = {
  girvaan: artwork("girvaan", [480], "480/583", "Girvaan pendant arranged among purple orchids", "10%"),
  chheda: artwork("chheda", [480, 923], "923/585", "Chheda Jewellers necklace and earrings on a model in black", "9%"),
  "maison-mireyaa": artwork("maison-mireyaa", [480, 960, 1440], "4500/5625", "Maison Mireyaa pink and burgundy bouquet — The bloom begins"),
  "high-on-smiles": artwork("high-on-smiles", [480, 926], "926/600", "High on Smiles blue dental floss held by a dentist", "9%"),
  "harshit-gold": artwork("harshit-gold", [480, 960, 1440], "2160/3000", "Harshit Gold necklace and earrings on green fabric with pink petals"),
};
