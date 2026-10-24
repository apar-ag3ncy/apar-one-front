# APAR — AGENTIVE CREACY

Brand portfolio built with Next.js App Router, React, TypeScript, GSAP, Motion and Three.js. The site uses the original APAR wordmark, Archivo / Newsreader typography and supplied client artwork.

## Run locally

```sh
npm ci
npm run dev -- --port 3021
```

For a production preview, stop the dev server first, then run:

```sh
npm run check
npm run check:production
npm run start -- --hostname 127.0.0.1 --port 3021
```

Keep one Next process per checkout. Building while the dev or production server is using the same `.next` directory can produce stale chunks. Do not commit `.next`, `node_modules`, credentials or raw campaign folders.

## Where to make changes

| Task | Location |
| --- | --- |
| Routes, metadata, API endpoint | `app/` |
| Home hero, featured projects, client logos, diamond | `components/home/` |
| Navigation, wordmark, footer galaxy, route transitions | `components/layout/` |
| Case pages, galleries, interactive brand studies | `components/work/` |
| Shared image/video frames and image pixel effect | `components/media/` |
| Reusable motion and scrolling | `components/motion/` |
| Testimonials, manifesto, forms, voice UI | Matching folders in `components/` |
| Client copy, colours, galleries, next links | `lib/cases/brands/<slug>.tsx` |
| Case index, shared types, media and motion profiles | `lib/cases/` |
| Global design rules and responsive overrides | `styles/` |
| Optimized files served to visitors | `public/` |
| Editable Blender, logo, glyph and unused font originals | `design-source/` |
| Asset preparation and production checks | `scripts/` |
| Offline regression checks / browser checks | `tests/` / `e2e/` |
| Private feedback schema | `supabase/migrations/` |

The [complete folder and file tree](docs/project-structure.md) includes all maintained files. Regenerate it with `npm run docs:tree` after adding or moving files.

## Updating content and assets

Read [the maintenance guide](docs/maintenance.md) and [case motion guide](docs/case-motion.md). Each brand has one content module, registered once in `lib/cases/index.ts`. The server derives client cards from that source. Browser components receive card data as props; they must not import the full case catalogue or build-time filesystem helpers.

Home featured artwork is intentionally curated separately from the complete client roster. Preserve two equal landscape cards on desktop and one card per screen on phones. Case pages keep white surfaces, black type and original brand colours in identity cards.

Only `public/` is served. Keep original high-resolution uploads outside that directory; export appropriately sized artwork and responsive variants. Source originals are preserved under `design-source/` or in ignored local campaign folders.

## Checks

- `npm run check`: strict lint, TypeScript, case/media/import-boundary tests and galaxy motion regression checks; no browser or provider credentials required.
- `npm run check:production`: production build plus gzip asset budgets for major routes, including shared layout code. Results go to ignored `reports/`.
- `npm run test:mobile`, `test:cases`, `test:polish`, `test:pixeltrail`, `test:manifesto`, `test:testimonials`: existing browser checks against an allowed local preview. These require browser access and are not part of the offline check.

The GitHub workflow runs offline checks and a production build on pushes to `main` and pull requests. Asset budgets detect regressions; they are not Lighthouse scores or proof of smoothness on a real phone.

## Motion and accessibility

Desktop retains its scroll, hover and text choreography. Mobile uses native scrolling and static text. Expensive scenes load near the viewport and stop when hidden; the mobile footer keeps its lower-cost galaxy. Reduced motion and image/logo fallbacks remain available. Keep effect initialization and cleanup in the owning feature; avoid assigning the same transform to multiple animation systems.

`styles/globals.css` imports the original core CSS in order. `app/layout.tsx` imports feature sheets afterward and `styles/mobile.css` last. Preserve this order when editing; responsive behaviour depends on it.

## Integrations

Copy `.env.example` to `.env.local` only when integration credentials are needed. Never commit populated environment files.

- [Private voice feedback](docs/voice-feedback.md): server-side upload to the separate `apar-one-front` Supabase project. This cleanup does not modify its tables, recordings or credentials.
- [Optional voice concierge](docs/voice-concierge.md): ElevenLabs configuration and fallback behaviour.
- Project brief endpoint and optional Adobe Fonts kit: documented in `.env.example`.
