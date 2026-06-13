/**
 * APAR's brand wordmark is set in **Fit** — the variable-width display typeface
 * by David Jonathan Ross (DJR). Fit is a LICENSED Adobe Fonts / Type Network
 * face: its files must never be bundled or redistributed. The only legitimate
 * way to serve it on the web is the agency's own Adobe Fonts WEB PROJECT.
 *
 * One-time setup:
 *   1. fonts.adobe.com → sign in → open these three families and "Add to Web
 *      Project":  Fit Variable,  Fit Devanagari Variable,  Fit Kannada Variable.
 *   2. Copy the kit id — the `xxxxxxx` in  https://use.typekit.net/xxxxxxx.css
 *   3. Either set the env var  NEXT_PUBLIC_ADOBE_FONTS_KIT=xxxxxxx  (.env.local),
 *      or paste it directly into ADOBE_FONTS_KIT below.
 *
 * Until a kit is connected, width-variable stand-ins (Roboto Flex for Latin,
 * Noto Sans Devanagari / Kannada for the other scripts) keep the wordmark and
 * its width animation alive — they are clearly NOT Fit; the real Fit families
 * win in the CSS font stacks (see --fit / --fit-deva / --fit-kannada).
 */
export const ADOBE_FONTS_KIT = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT ?? "";
