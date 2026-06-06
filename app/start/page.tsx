import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { StartProjectForm } from "@/components/start-project-form";

export const metadata: Metadata = {
  title: "Start a Project — APAR Digital Marketing Agency",
  description:
    "Tell us about your brand and let's start a project together. Branding, digital marketing, AI content and campaigns — or just get in touch.",
};

export default function StartPage() {
  return (
    <>
      <section className="page-hero" data-screen-label="Start — Hero">
        <div className="wrap">
          <Reveal className="eyebrow">
            <i className="dot" /> Get in touch
          </Reveal>
          <Reveal as="h1" className="display d-lg" style={{ marginTop: 8 }}>
            Let&apos;s start a <em>project.</em>
          </Reveal>
          <Reveal as="p" className="lead" i={1}>
            Tell us about your brand and where you want to take it. We read every message ourselves
            and reply within one working day — no bots, no funnels.
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }} data-screen-label="Start — Form">
        <div className="wrap">
          <div className="divline" />
          <div className="start-grid" style={{ marginTop: 56 }}>
            <StartProjectForm />

            <aside className="contact-aside">
              <Reveal className="contact-block" i={1}>
                <h4>Email</h4>
                <a href="mailto:info@apar.agency">info@apar.agency</a>
                <span className="muted">For enquiries &amp; new projects</span>
              </Reveal>
              <Reveal className="contact-block" i={2}>
                <h4>Phone</h4>
                <a href="tel:+919769530750">+91 97695 30750</a>
                <span className="muted">Mon–Sat, 10am–7pm IST</span>
              </Reveal>
              <Reveal className="contact-block" i={3}>
                <h4>Studio</h4>
                <p>
                  Vile Parle East,
                  <br />
                  Mumbai, India
                </p>
              </Reveal>
              <Reveal className="contact-block" i={4}>
                <h4>What happens next</h4>
                <p className="muted">
                  We reply within a working day to set up a short intro call, understand the brief,
                  and share how we&apos;d approach it.
                </p>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
