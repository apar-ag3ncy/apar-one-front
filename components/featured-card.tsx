"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Reveal } from "./reveal";
import { PhotoSlot } from "./photo-slot";
import { useCaseTransition } from "./transition-provider";
import { featuredCardVars, type FeaturedClient } from "@/lib/cases";
import { caseMotion } from "@/lib/case-motion";
import { HoverText } from "./hover-text";

/** A visible editorial caption, with a separate, brand-directed moving artwork layer. */
export function FeaturedCard({ client, i }: { client: FeaturedClient; i: number }) {
  const root = useRef<HTMLDivElement>(null);
  const transition = useCaseTransition();
  const profile = caseMotion(client.slug);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const card = el.querySelector<HTMLElement>(".client-story-link")!;
      const art = el.querySelector<HTMLElement>(".client-story-art")!;
      const seal = el.querySelector<HTMLElement>(".client-story-seal");
      const title = el.querySelector<HTMLElement>(".client-story-name")!;
      const arrow = el.querySelector<HTMLElement>(".client-story-arrow")!;
      const ctx = gsap.context(() => {
        const x = gsap.quickTo(art, "x", { duration: .8, ease: "power3.out" });
        const y = gsap.quickTo(art, "y", { duration: .8, ease: "power3.out" });
        // quickTo bypasses CSS shorthand expansion: scaleX/Y are real setters.
        const scaleX = gsap.quickTo(art, "scaleX", { duration: 1, ease: "power3.out" });
        const scaleY = gsap.quickTo(art, "scaleY", { duration: 1, ease: "power3.out" });
        const turn = seal ? gsap.quickTo(seal, "rotation", { duration: 1.2, ease: "power3.out" }) : () => {};
        const shift = gsap.quickTo(title, "x", { duration: .55, ease: "power3.out" });
        const arrowX = gsap.quickTo(arrow, "x", { duration: .55, ease: "power3.out" });
        let over = false, focus = false;
        let bounds = card.getBoundingClientRect();
        const update = () => {
          const active = over || focus;
          scaleX(active ? 1.055 : 1); scaleY(active ? 1.055 : 1);
          turn(active ? profile.direction * 24 : 0);
          shift(active ? 12 : 0); arrowX(active ? 0 : -9);
          if (!active) { x(0); y(0); }
        };
        const enter = () => { over = true; bounds = card.getBoundingClientRect(); update(); };
        const leave = () => { over = false; update(); };
        const focused = () => { focus = true; update(); };
        const blurred = () => { focus = false; update(); };
        const move = (event: PointerEvent) => {
          if (!over || event.pointerType !== "mouse") return;
          x(gsap.utils.clamp(-5, 5, (event.clientX - bounds.left - bounds.width / 2) / bounds.width * -10));
          y(gsap.utils.clamp(-4, 4, (event.clientY - bounds.top - bounds.height / 2) / bounds.height * -8));
        };
        card.addEventListener("pointerenter", enter); card.addEventListener("pointerleave", leave);
        card.addEventListener("pointermove", move, { passive: true });
        card.addEventListener("focusin", focused); card.addEventListener("focusout", blurred);
        return () => {
          card.removeEventListener("pointerenter", enter); card.removeEventListener("pointerleave", leave);
          card.removeEventListener("pointermove", move);
          card.removeEventListener("focusin", focused); card.removeEventListener("focusout", blurred);
        };
      }, el);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, [profile]);

  return <div ref={root} className="client-story" data-form={profile.form}>
    <Reveal i={i % 2}>
      <Link className="client-story-link" href={client.href} style={featuredCardVars(client)}
        aria-label={`Explore ${client.name}'s case study`}
        onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          transition({ href: client.href, label: client.name, color: client.theme.bg, ink: client.theme.ink });
        }}>
        <div className={`client-story-media${profile.cover ? " has-photo" : ""}`}>
          <div className="client-story-art">
            {profile.cover && <PhotoSlot src={profile.cover} fixedRatio="20/13" radius={16} placeholder={`${client.name} — selected work`} />}
            {!profile.cover && <span className="client-story-seal" aria-hidden="true"><i /><i /><i /></span>}
          </div>
          <span className="client-story-index">{client.i} / APĀR</span>
          <span className={`client-story-mark${client.logoTint || client.logoInvert ? " mono" : ""}`}
            style={client.logoTint ? { color: client.logoTint } : undefined} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={client.logo} alt="" width={400} height={400} loading="lazy" draggable={false} />
          </span>
          <span className="client-story-explore" aria-hidden="true"><HoverText>Explore the story</HoverText><i>↗</i></span>
        </div>
        <div className="client-story-caption">
          <div className="client-story-meta"><span>{client.cat}</span><span>{client.year}</span></div>
          <h3><span className="client-story-arrow" aria-hidden="true">→</span><span className="client-story-name">{client.name}</span></h3>
          <p>{client.blurb}</p>
        </div>
      </Link>
    </Reveal>
  </div>;
}
