"use client";

import { useState } from "react";
import Link from "next/link";
import { AestheticDial, type DialOption } from "./aesthetic-dial";

/** Aesthetic directions we lift brands toward - the rotary dial cycles these. */
const AESTHETICS: DialOption[] = [
  { key: "minimal", label: "Minimal", desc: "Clean, restrained, generous space.",
    bestFor: "Modern D2C, skincare & tech-forward labels",
    traits: ["Calm", "Confident", "Uncluttered"] },
  { key: "luxe", label: "Luxe", desc: "Opulent, refined, high-craft.",
    bestFor: "Fine jewellery, couture & luxury hospitality",
    traits: ["Exclusive", "Crafted", "Timeless"] },
  { key: "bold", label: "Bold", desc: "Loud, confident, high-contrast.",
    bestFor: "Challenger brands, streetwear & big launches",
    traits: ["Fearless", "Energetic", "Unmissable"] },
  { key: "editorial", label: "Editorial", desc: "Type-led, magazine energy.",
    bestFor: "Studios, media & design-led brands",
    traits: ["Intelligent", "Curated", "Cultured"] },
  { key: "heritage", label: "Heritage", desc: "Timeless, classic, built to last.",
    bestFor: "Legacy houses, family businesses & artisans",
    traits: ["Trusted", "Rooted", "Enduring"] },
  { key: "playful", label: "Playful", desc: "Vibrant, characterful, a little fun.",
    bestFor: "Food & drink, lifestyle & community brands",
    traits: ["Warm", "Approachable", "Joyful"] },
  { key: "organic", label: "Organic", desc: "Warm, natural, a human touch.",
    bestFor: "Wellness, artisanal & sustainable brands",
    traits: ["Honest", "Earthy", "Human"] },
];

export function StartForm() {
  const [brand, setBrand] = useState("");
  const [offer, setOffer] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [aesthetic, setAesthetic] = useState(0);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend yet - capture the brief client-side and confirm. (Wire to an
    // endpoint / email service later; the shape is ready.)
    const brief = { brand, offer, name, email, aesthetic: AESTHETICS[aesthetic].key };
    if (typeof console !== "undefined") console.info("APAR brief", brief);
    setSent(true);
  };

  return (
    <section className="start" data-screen-label="Start a project">
      <div className="start-glow" aria-hidden />

      <header className="start-top">
        <span className="start-eyebrow">
          <i className="dot" /> Start a project
        </span>
        <Link className="start-close" href="/" aria-label="Back to home">
          ↩ Back
        </Link>
      </header>

      {sent ? (
        <div className="start-done">
          <span className="start-eyebrow">
            <i className="dot" /> Brief received
          </span>
          <h1 className="start-h1">
            Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We&apos;ve got it.
          </h1>
          <p className="start-lead">
            We&apos;ll study <em>{brand || "your brand"}</em> and come back within two working days
            with a first point of view - shaped for a{" "}
            <strong>{AESTHETICS[aesthetic].label.toLowerCase()}</strong> direction.
          </p>
          <div className="start-done-actions">
            <Link className="btn cream" href="/work">
              <span>See our work</span>
              <span className="arr">↗</span>
            </Link>
            <Link className="btn-ghost light" href="/">
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <form className="start-form" onSubmit={onSubmit}>
          <div className="start-grid">
            <div className="start-aesthetic">
              <span className="fld-l">03 — Aesthetic direction</span>
              <p className="start-aesthetic-hint">
                Which direction should your brand own? Spin through — each one signals something
                different.
              </p>
              <AestheticDial options={AESTHETICS} value={aesthetic} onChange={setAesthetic} />
              <div className="aesthetic-guide" key={AESTHETICS[aesthetic].key}>
                <div className="ag-row">
                  <span className="ag-k">Best for</span>
                  <span className="ag-v">{AESTHETICS[aesthetic].bestFor}</span>
                </div>
                <div className="ag-traits" aria-label="What it signals">
                  {AESTHETICS[aesthetic].traits?.map((t) => (
                    <span className="ag-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="start-left">
              <div className="start-head">
                <h1 className="start-h1">
                  Tell us about <em>your brand.</em>
                </h1>
                <p className="start-lead">
                  We take good brands and lift them to top-notch. A few details and one gut-check on
                  direction - that&apos;s all we need to start.
                </p>
              </div>

              <div className="start-fields">
              <label className="fld">
                <span className="fld-l">01 — Brand name</span>
                <input
                  className="fld-in"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Chheda Jewellers"
                  required
                  autoComplete="organization"
                />
              </label>

              <label className="fld">
                <span className="fld-l">02 — What you offer in the market</span>
                <textarea
                  className="fld-in fld-area"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="What you sell, who it's for, what makes it different…"
                  rows={3}
                  required
                />
              </label>

              <div className="fld-row">
                <label className="fld">
                  <span className="fld-l">Your name</span>
                  <input
                    className="fld-in"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    autoComplete="name"
                  />
                </label>
                <label className="fld">
                  <span className="fld-l">Email</span>
                  <input
                    className="fld-in"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brand.com"
                    required
                    autoComplete="email"
                  />
                </label>
              </div>

                <button className="start-submit" type="submit">
                  <span>Send the brief</span>
                  <span className="arr">↗</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
