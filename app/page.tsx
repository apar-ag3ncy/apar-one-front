import { Hero } from "@/components/hero";
import { MJShowcase } from "@/components/mj-showcase";
import { Faq } from "@/components/faq";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { CASES } from "@/lib/cases";
import { caseAssets } from "@/lib/case-assets";
import { ProgressiveQuote, FeaturedProjects, MovingClients } from "@/components/home-flow";

export default function Home() {
  return <main className="meeting-home">
    <Hero start />
    <ProgressiveQuote id="studio" text="Limitless. Beyond Culture." />
    <FeaturedProjects />
    <MJShowcase />
    <MovingClients />
    <TestimonialCarousel pages={Object.values(CASES).map(data => ({
      slug: data.slug,
      name: data.card.name,
      category: data.card.cat,
      image: data.slug === "chheda" ? caseAssets(data.slug, 1).photoSrcs[0] : caseAssets(data.slug, 0).heroSrc,
      imageAlt: `${data.card.name} — brand imagery`,
      logo: data.logo ?? `/logos/${data.slug}.png`,
      logoTint: data.logoTint,
      logoInvert: data.logoInvert,
      surface: `linear-gradient(135deg, ${data.theme.bg}, ${data.theme.bg2})`,
      quote: data.quote.text,
      by: data.quote.by,
      kind: data.quote.by.includes("Campaign line") ? "Campaign line" as const : "Client words" as const,
    }))} />

    <Faq />
  </main>;
}
