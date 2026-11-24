import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import "@/styles/home-flow.css";
import "@/styles/case-motion.css";
import "@/styles/site-polish.css";
import "@/styles/text-actions.css";
import "@/styles/faq-motion.css";
import "@/styles/surfaces.css";
import "@/styles/mobile.css";
import "@/styles/typography.css";
import "@/styles/glass.css";
import "@/styles/mobile-navigation.css";
import "@/styles/internal-pages.css";
import { Nav } from "@/components/layout/nav";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ScrollProgressBar } from "@/components/motion/scroll-progress-bar";
import { TransitionProvider } from "@/components/layout/transition-provider";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { MotionProvider } from "@/components/motion/motion-provider";
import { DesktopSlowMo } from "@/components/motion/desktop-slow-mo";
import { LiquidTextScroll } from "@/components/motion/liquid-text-scroll";
import { PixelTrail } from "@/components/motion/pixel-trail";
import { TalkToUs } from "@/components/voice/talk-to-us";
import { ADOBE_FONTS_KIT } from "@/lib/adobe-fonts";
import { IconSprite } from "@/components/ui/icon-sprite";

export const metadata: Metadata = {
  // Production origin for absolute social-preview URLs.
  metadataBase: new URL("https://apar.agency"),
  title: "APAR — AGENTIVE CREACY",
  description:
    "APAR is a digital marketing and branding agency in Mumbai for jewellery houses and premium brands. Strategy, branding, performance marketing, AI content and campaigns.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload the local Fit wordmark fonts (WOFF2) so "APĀR" - including the
            Devanagari अ - renders in real Fit on first paint, no fallback flash. */}
        <link rel="preload" href="/fit-devnagari/Fit_Latin_Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fit-devnagari/Fit_Devanagari_Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/fontshare/Satoshi-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* UI uses local Satoshi. The wordmark keeps its local Fit faces.
            Do not block every page on unused external fallback fonts. An agency
            Adobe kit remains available for other brand artwork when configured. */}
        {ADOBE_FONTS_KIT ? (
          <link rel="stylesheet" href={`https://use.typekit.net/${ADOBE_FONTS_KIT}.css`} />
        ) : null}
      </head>
      <body id="top" data-page="index">
        <IconSprite />
        <MotionProvider>
          <SmoothScroll />
          {/* Media parallax, velocity skew and footer wordmark motion. */}
          <DesktopSlowMo />
          <LiquidTextScroll />
          {/* Site-wide pixel cursor trail (the hero pixel-dome language everywhere). */}
          <PixelTrail />
          <ScrollProgressBar />
          <Nav />
          <TalkToUs />
          <TransitionProvider>
            {children}
            <ConditionalFooter />
          </TransitionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
