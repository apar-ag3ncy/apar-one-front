import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ConditionalFooter } from "@/components/conditional-footer";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollProgressBar } from "@/components/scroll-progress-bar";
import { TransitionProvider } from "@/components/transition-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SplashCursor } from "@/components/splash-cursor";
import { TalkToUs } from "@/components/talk-to-us";

export const metadata: Metadata = {
  title: "APAR — Digital Marketing & Branding Agency, Mumbai",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-page="index">
        <SmoothScroll />
        <SplashCursor />
        <ScrollProgressBar />
        <CustomCursor />
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
