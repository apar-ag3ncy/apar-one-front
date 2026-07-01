/**
 * APAR's brand wordmark is set in **Fit** - the variable-width display typeface
 * by David Jonathan Ross (DJR). Fit is a LICENSED Adobe Fonts / Type Network
 * face: its files must never be bundled or redistributed. The only legitimate
 * way to serve it on the web is the agency's own Adobe Fonts WEB PROJECT.
 *
 * The logo's leading-"A" transition cycles across the languages Fit ships in.
 * Latin "A" and Devanagari "अ" are baked vector outlines from the master art, so
 * they ALWAYS work with zero setup. The other Fit scripts only join the cycle once
 * their REAL Fit web family is loaded via the kit (the component verifies a loaded
 * @font-face before ever showing a script - it never falls back to a non-Fit face).
 *
 * One-time setup to light up ALL of Fit's scripts in the A-transition:
 *   1. fonts.adobe.com → sign in → "Add to Web Project" for each Fit family you
 *      want in the cycle. Family → exact CSS name the component checks for:
 *        Fit Variable ............... fit-variable        (Latin + Cyrillic + Greek)
 *        Fit Hebrew Variable ........ fit-hebrew-variable
 *        Fit Armenian Variable ...... fit-armenian-variable
 *        Fit Devanagari Variable .... fit-devanagari-variable  (अ already vectorized)
 *        Fit Tamil Variable ......... fit-tamil-variable
 *        Fit Kannada Variable ....... fit-kannada-variable
 *        Fit Arabic Variable ........ fit-arabic-variable
 *   2. Copy the kit id - the `xxxxxxx` in  https://use.typekit.net/xxxxxxx.css
 *   3. Set the env var  NEXT_PUBLIC_ADOBE_FONTS_KIT=xxxxxxx  (.env.local),
 *      or paste it directly into ADOBE_FONTS_KIT below.
 *
 * Until a kit is connected, the logo stays strictly Fit by cycling only the two
 * vector glyphs (A ⟷ अ). The --fit-* stand-in stacks in globals.css are for
 * non-logo Fit usage and are never used inside the logo transition.
 */
export const ADOBE_FONTS_KIT = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT ?? "";
