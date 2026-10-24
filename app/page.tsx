import { Hero } from "@/components/home/hero";
import { MJShowcase } from "@/components/home/diamond";
import { HomeImageBento } from "@/components/home/home-image-bento";
import { Faq } from "@/components/home/faq";
import { TestimonialCarousel } from "@/components/testimonials/testimonial-carousel";
import { CASES } from "@/lib/cases";
import { caseAssets } from "@/lib/cases/assets.server";
import { ProgressiveQuote, FeaturedProjects } from "@/components/home/featured";

import { MovingClients } from "@/components/home/featured/moving-clients";

export default function Home() {
  return <main className="meeting-home">
    <Hero start />
    <ProgressiveQuote id="studio" text="Limitless. Beyond Culture." />
    <FeaturedProjects />
    <MJShowcase />
    <HomeImageBento />
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
