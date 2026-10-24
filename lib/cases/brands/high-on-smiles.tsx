import type { CaseData } from "../types";
import { FONTS_DEFAULT } from "../fonts";

const data: CaseData = {
    slug: "high-on-smiles",
    eyebrow: "Featured client · Dental Clinic",
    title: <>High on Smiles</>,
    card: {
      name: "High on Smiles",
      cat: "Dental",
      blurb: "Smiles worth showing off - brand, content and campaigns for a modern dental clinic.",
    },
    logoInvert: true,
    fonts: FONTS_DEFAULT,
    sub: "A modern dental clinic, made approachable - a bright, clean world that turns nervous first-timers into loyal, smiling regulars.",
    theme: {
      bg: "#4A80C6",
      bg2: "#5E91D2",
      ink: "#FFFFFF",
      soft: "rgba(255,255,255,.92)",
      accent: "#FFFFFF",
      accentSoft: "rgba(255,255,255,.18)",
      line: "rgba(255,255,255,.26)",
    },
    heroPlaceholder: "High on Smiles · A bright, welcoming dental identity",
    meta: [
      { label: "Services", value: "Branding · Social · Performance" },
      { label: "Sector", value: "Dental · Healthcare" },
      { label: "Year", value: "2024" },
      { label: "Engagement", value: "Retainer" },
    ],
    brief: {
      lead: "Great dentistry hidden behind a clinical, forgettable brand - and a feed that didn't build trust.",
      challenge:
        "High on Smiles needed to feel warm, modern and reassuring - a brand that eased anxiety and made booking effortless, with content and ads that filled the appointment book.",
      did: [
        "Friendly brand identity - bright & clean",
        "Patient-education social content",
        "Reviews & reputation building",
        "Performance ads for appointments",
      ],
    },
    approach: {
      lead: (
        <>
          Bright, warm and reassuring - a clinic that feels more <em>welcome</em> than waiting room.
        </>
      ),
      gallery: [
        { cls: "wide", placeholder: "Patient education · A reassuring first impression", ratio: "3/2" },
        { cls: "wide", placeholder: "Brand stationery · The clinic identity", ratio: "10/7" },
        { cls: "tall", placeholder: "Smiling young patient · Human-centred care", ratio: "1/1" },
        { cls: "wide", placeholder: "Care products · Branded essentials", ratio: "16/9" },
        { cls: "wide", placeholder: "Treatment suite · Calm clinical space", ratio: "10/7" },
        { cls: "wide", placeholder: "Clinic exterior · The identity at scale", ratio: "16/9" },
        { cls: "wide", placeholder: "Reception signage · A welcoming arrival", ratio: "16/9" },
        { cls: "wide", placeholder: "Clinic interior · A brighter experience", ratio: "10/7" },
      ],
    },
    stats: [
      { n: 3.7, suffix: "×", label: "Appointment enquiries" },
      { n: 64, suffix: "%", label: "More new patients" },
      { n: 4.8, suffix: "★", label: "Average review score" },
    ],
    quote: {
      text: (
        <>
          &ldquo;Patients walk in already <em>smiling</em> - they feel like they know us.&rdquo;
        </>
      ),
      by: "Founder - High on Smiles",
    },
    next: { kicker: "Next case", name: "Silver Emporium", href: "/work/silver-emporium", color: "#11294A", ink: "#E5EAF2" },
  };

export default data;
