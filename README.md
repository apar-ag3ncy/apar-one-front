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
- `/work/[slug]` — twelve themed case studies (one per client in `lib/cases.tsx`)
- `/what-we-do` — services
- `/start` — project brief form (delivers to `NEXT_PUBLIC_BRIEF_ENDPOINT`, or opens an email to the studio)

Case studies are footer-less and chain via a "keep scrolling" overscroll transition into the next client. A site-wide pixel cursor trail (the hero's pixel-dome language) and Lenis smooth scrolling run everywhere; everything degrades for reduced-motion and touch.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Notes

Case pages without photography yet show a branded logo card (`components/photo-slot.tsx`); drop `hero.jpg` / `1.jpg…` into `public/work/<slug>/` and the real images take over.

Optional env (`.env.example`): `NEXT_PUBLIC_BRIEF_ENDPOINT` (brief form delivery), `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (voice concierge), `NEXT_PUBLIC_ADOBE_FONTS_KIT` (Fit wordmark scripts).
