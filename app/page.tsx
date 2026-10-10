import { HomeArrival } from "@/components/hyperspace-intro";
import { MJShowcase } from "@/components/mj-showcase";
import { Faq } from "@/components/faq";
import { Reveal } from "@/components/reveal";
import { ProgressiveQuote, FeaturedProjects, MovingClients } from "@/components/home-flow";

export default function Home() {
  return <main className="meeting-home">
    <HomeArrival />
    <ProgressiveQuote id="studio" label="01 / Our belief" text="Limitless. Beyond Culture." explanation="Rooted in who you are. Open to what you can become. We bring strategy, design and technology together to move brands beyond the expected." />
    <FeaturedProjects />
    <ProgressiveQuote id="manifesto" label="03 / From identity to interaction" text="We don’t just build brands. We build the way they’re experienced." explanation="A story becomes stronger when people can step inside it. Every image, every movement, every interaction is a chance to make your brand felt." dark />
    <MJShowcase />
    <MovingClients />
      {/* ===== TESTIMONIALS ===== */}
      <section className="section testi" data-screen-label="Home - Testimonials">
        <div className="wrap">
          <div className="tag-line">
            <span>06 / In their words</span>
            <i className="ln" />
          </div>
          <Reveal as="p" className="feat">
            &ldquo;They didn&apos;t just market us - they made us <em>iconic.</em> Footfall and online
            enquiries both jumped within a season.&rdquo;
          </Reveal>
          <Reveal className="by">Director - Chheda Jewellers</Reveal>
          <div className="testi-grid">
            <Reveal>
              <blockquote>
                &ldquo;The campaign visuals looked like a six-figure shoot. Our festive collection sold
                out faster than ever.&rdquo;
              </blockquote>
              <div className="by2">Founder - Girvaan</div>
            </Reveal>
            <Reveal i={1}>
              <blockquote>
                &ldquo;Finally an agency that leads with strategy. Every rupee of ad spend had a clear
                reason behind it.&rdquo;
              </blockquote>
              <div className="by2">Marketing Head - Diarah</div>
            </Reveal>
          </div>
        </div>
      </section>

    <Faq />
  </main>;
}
