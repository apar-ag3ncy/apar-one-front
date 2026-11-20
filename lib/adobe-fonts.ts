/**
 * Optional agency Adobe Fonts web project for brand artwork.
 * The APAR logo uses the bundled Fit Latin and Devanagari faces and alternates
 * strictly between अ and A. A configured kit cannot expand that sequence.
 * Set NEXT_PUBLIC_ADOBE_FONTS_KIT to the agency's existing web-project ID when
 * other artwork needs its licensed web fonts.
 */
export const ADOBE_FONTS_KIT = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT ?? "";
