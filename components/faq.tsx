"use client";

import { DESKTOP_MOTION_QUERY, useMobileLayout } from "@/lib/motion-policy";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  const mobile = useMobileLayout();
  const root = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? pinned;

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      root.current?.querySelectorAll<HTMLElement>(".faq-label").forEach(label => {
        gsap.fromTo(label, { backgroundSize: "0% 100%" }, {
          backgroundSize: "100% 100%", ease: "none",
          scrollTrigger: { trigger: label.closest(".faq-item"), start: "top 90%", end: "top 55%", scrub: .35 },
        });
      });
    });
    return () => media.revert();
  }, []);

  return (
    <section ref={root} className="section faq faq-motion" id="contact" data-screen-label="Home - FAQ">
      <div className="wrap faq-wrap">
        <div className="faq-head">
          <Reveal as="h2" className="display d-md">
            Questions, <em>answered.</em>
          </Reveal>
        </div>
        <Accordion type="single" collapsible className="faq-list" value={active}
          onValueChange={value => { setPinned(value); setHovered(null); }}
          onKeyDown={event => {
            if (event.key === "Escape") { setPinned(""); setHovered(null); event.preventDefault(); }
          }}>
          {ITEMS.map((item, i) => {
            const value = `item-${i}`;
            return <AccordionItem key={value} value={value}
              onPointerEnter={event => { if (!mobile && event.pointerType === "mouse") setHovered(value); }}
              onPointerLeave={() => setHovered(null)}>
              <AccordionTrigger>
                <span className="faq-label">{item.q}</span>
              </AccordionTrigger>
              {/* Both faces share one grid cell, reserving enough room for the answer.
                  Hover never changes the row height or moves the pointer's target. */}
              <AccordionContent forceMount aria-hidden={active !== value}>
                <p>{item.a}</p>
              </AccordionContent>
            </AccordionItem>;
          })}
        </Accordion>
      </div>
    </section>
  );
}
