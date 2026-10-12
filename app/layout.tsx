import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-flow.css";
import "./case-motion.css";
import { Nav } from "@/components/nav";
import { ConditionalFooter } from "@/components/conditional-footer";
import { ScrollProgressBar } from "@/components/scroll-progress-bar";
import { TransitionProvider } from "@/components/transition-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SlowMo } from "@/components/slow-mo";
import { PixelTrail } from "@/components/pixel-trail";
import { TalkToUs } from "@/components/talk-to-us";
import { ADOBE_FONTS_KIT } from "@/lib/adobe-fonts";

export const metadata: Metadata = {
  // Absolute base for OG/canonical URLs (silences the build warning and makes
  // social previews resolve). Update when the custom domain goes live.
  metadataBase: new URL("https://apar-one-front.vercel.app"),
  title: "APAR — AGENTIVE CREACY",
  description:
    "APAR is a digital marketing and branding agency in Mumbai for jewellery houses and premium brands. Strategy, branding, performance marketing, AI content and campaigns.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload the local Fit wordmark fonts (WOFF2) so "APĀR" - including the
            Devanagari अ - renders in real Fit on first paint, no fallback flash. */}
        <link rel="preload" href="/fit-devnagari/Fit_Latin_Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fit-devnagari/Fit_Devanagari_Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/argon/Argon-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/argon/Argon-Oblique.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        {/* UI uses local Argon; the wordmark uses its existing local Fit faces.
            Do not block every page on unused external fallback fonts. An agency
            Adobe kit may still add genuine Fit scripts when configured. */}
        {ADOBE_FONTS_KIT ? (
          <link rel="stylesheet" href={`https://use.typekit.net/${ADOBE_FONTS_KIT}.css`} />
        ) : null}
      </head>
      <body id="top" data-page="index">
        <SmoothScroll />
        {/* Cinematic slow-motion layer (GSAP): media parallax + slow zoom, velocity
            skew, masked line reveals, footer wordmark parallax. See slow-mo.tsx. */}
        <SlowMo />
        {/* Site-wide pixel cursor trail (the hero pixel-dome language everywhere).
            Swap back to <SplashCursor /> for the fluid lava trail. */}
        <PixelTrail />
        <ScrollProgressBar />
        <Nav />
        <TalkToUs />
        <TransitionProvider>
          {children}
          <ConditionalFooter />
        </TransitionProvider>
      </body>
    </html>
  );
}
