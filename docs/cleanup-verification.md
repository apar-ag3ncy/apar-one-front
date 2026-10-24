# Structural cleanup verification — 24 October 2026

## Scope

Organized UI by feature, separated server-only case content from browser components, moved 13 client stories to individual modules, extracted shared image readiness, split the global stylesheet without changing rule order, and moved unused original fonts out of public assets. Removed eight modules that were unreachable from every route, including dynamic imports, plus the unused `class-variance-authority` dependency. Asset scripts now declare their existing Sharp dependency directly.

The existing uncommitted mobile layout, footer galaxy and image-edge fixes were retained. No backend, recording, credential, palette or logo-font change is part of this cleanup. No push or deployment was performed.

## Preservation checks

- All 23 generated HTML page bodies match the pre-cleanup build after excluding framework script/link tags. This compares actual markup, attributes and visible text, not only routes existing.
- All 13 case data objects, including React copy, font stacks, colours, galleries and next links, match their original values.
- The split global CSS has the same ordered rules and declarations as the original; comments and file locations differ.
- Shipped artwork and archived source/font files were checked against Git by SHA-256. Image pixels were not recompressed.
- No orphan source modules remain in the app/components/lib import graph.

## Production footprint

Measurements below sum gzip-compressed JavaScript in each route's manifest plus its shared root layout. They are not the same as Next's route-only size column.

| Route | Before, bytes | After, bytes | Change |
| --- | ---: | ---: | ---: |
| Home | 271,247 | 262,481 | −3.2% |
| Clients | 248,277 | 240,081 | −3.3% |
| Work | 250,383 | 242,336 | −3.2% |
| Case template | 248,218 | 248,545 | +0.1% |
| Manifesto | 235,988 | 236,058 | <0.1% |

The small increases are included rather than described as universal savings. Server-rendering the logo links adds about 0.9 KB to the compressed home HTML while removing about 8.8 KB of its JavaScript. Passing work-card data as server props adds about 1.3 KB to work HTML while removing about 8.0 KB of JavaScript.

Public assets decreased from 50,228,433 to 43,146,784 bytes (14.1%) by preserving 7,081,649 bytes of unused font originals outside `public/`. Those fonts were not previously part of the initial browser request; this is a public asset footprint reduction, not a claimed 7 MB page-load saving. Application/component/library/style source decreased from 17,481 to 15,271 lines; new checks and documentation are additional maintenance tooling.

## Repeatable checks and limitations

`npm run check` covers strict lint, TypeScript and five offline regression checks. `npm run check:production` builds all routes and checks compiled JS/CSS budgets. The full file inventory is regenerated with `npm run docs:tree`.

Live browser interaction checks remain blocked by the saved localhost browser permission. No new Lighthouse score, mobile frame-rate result or visual interaction pass is claimed. Existing browser tests remain available in `e2e/` for an allowed session. The comparison above verifies generated output and assets, not GPU rendering or a physical phone.
