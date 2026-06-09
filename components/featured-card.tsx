"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "./reveal";
import { featuredCardVars, type FeaturedClient } from "@/lib/cases";

/**
 * Featured-client card. At rest it shows the brand logo (once it has actually
 * loaded; otherwise the brand name — so a missing file never shows a broken
 * image). The logo scales/fades in, a glassy shine sweeps across as the card
 * enters view, and on hover/focus/press it cross-fades to the case info.
 * Shared by the home and clients pages so the markup lives in one place.
 */
export function FeaturedCard({ client, i }: { client: FeaturedClient; i: number }) {
  const [logoLoaded, setLogoLoaded] = useState(false);

  return (
    <Reveal
      i={i}
      as={Link}
      href={client.href}
      className="fc-card"
      style={featuredCardVars(client)}
    >
      {/* Rest face: the logo if it loads, otherwise the name (no broken image). */}
      <span className="fc-logo" aria-hidden="true">
        {client.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={`fc-logo-img${client.logoInvert ? " fc-logo-img--invert" : ""}`}
            src={client.logo}
            alt=""
            data-loaded={logoLoaded ? "true" : "false"}
            onLoad={() => setLogoLoaded(true)}
          />
        ) : null}
        {!logoLoaded && <span className="fc-logo-name">{client.name}</span>}
      </span>

      {/* Glassy shine that sweeps across once as the card scrolls into view. */}
      <motion.span
        className="fc-shine"
        aria-hidden="true"
        initial={{ x: "-160%", skewX: -14 }}
        whileInView={{ x: "320%", skewX: -14 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 1.15, ease: "easeInOut", delay: 0.3 + i * 0.08 }}
      />

      <span className="fc-body">
        <span className="fc-top">
          <span className="fc-i">{client.i}</span>
          <span className="fc-cat">{client.cat}</span>
        </span>
        <h3>{client.name}</h3>
        <p>{client.blurb}</p>
        <span className="fc-go">
          View case <i>↗</i>
        </span>
      </span>
    </Reveal>
  );
}
