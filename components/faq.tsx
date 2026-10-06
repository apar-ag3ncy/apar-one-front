"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Reveal } from "./reveal";

const ITEMS = [
  {
    q: "What kind of brands do you work with?",
    a: "We focus on jewellery houses and real-estate builders & contractors - but we take on any ambitious brand where strategy, branding and content can move the needle.",
  },
  {
    q: "Do you work on retainer or per project?",
    a: "Both. Some clients engage us for a single campaign or rebrand; others keep us on a monthly retainer for always-on marketing and content. We'll recommend what fits your goals.",
  },
  {
    q: "How do you use AI in content creation?",
    a: "We pair AI production with human art direction to create lookbooks, product imagery, campaign films and copy - studio-grade output, shipped far faster than a traditional shoot.",
  },
  {
    q: "How long does a typical project take?",
    a: "A focused campaign can launch in 3-4 weeks; a full brand build runs 6-10 weeks. We'll give you a clear timeline after the first conversation.",
  },
  {
    q: "Where are you based?",
    a: "Our studio is in Vile Parle East, Mumbai - and we work with brands across India, in person and remotely.",
  },
];

export function Faq() {
  return (
    <section className="section faq" id="contact" data-screen-label="Home - FAQ">
      <div className="wrap faq-wrap">
        <div className="faq-head">
          <div className="tag-line">
            <span>06 - Good to know</span>
            <i className="ln" />
          </div>
          <Reveal as="h2" className="display d-md" style={{ marginTop: 26 }}>
            Questions, <em>answered.</em>
          </Reveal>
        </div>
        <Accordion type="single" collapsible className="faq-list">
          {ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>
                <p>{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
