# APAR — Digital Marketing & Branding Agency

Marketing site for **APAR**, a Mumbai digital marketing and branding agency for jewellery houses and premium brands. Built in the "Editorial Press" direction — warm cream, ink, and a punchy red (`#EB3B25`), with Archivo + Newsreader type.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** — hero entrance, scroll reveals, masked word/stagger, magnetic buttons, scroll-velocity skew, seamless page transitions
- **GSAP + ScrollTrigger** — brand-band logo reveal, pinned horizontal work gallery, scroll-fill statement
- **shadcn** (Radix) — FAQ accordion
- **Magic UI** — Marquee

## Pages

- `/` — home (hero, brand band, pinned work gallery, services, stats, process, testimonials, clients, FAQ)
- `/work` — filterable work grid
- `/clients` — featured stories + full roster
- `/work/[slug]` — themed case studies (`chheda`, `girvaan`, `diarah`)

Case studies are footer-less and chain via a "keep scrolling" overscroll transition into the next client. A custom inverting/brand-red cursor and an intro reveal run site-wide; everything degrades for reduced-motion and touch.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Notes

Project imagery uses styled placeholders (`components/image-slot.tsx`) — drop real campaign images in later.
