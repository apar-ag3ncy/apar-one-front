# Client logos

Drop each client's logo here, named by its case **slug**, e.g.:

- `chheda.svg` → shown on the Chheda Jewellers featured card
- `girvaan.svg`, `diarah.svg`, `maison-mireyaa.svg`, `achal.svg`,
  `high-on-smiles.svg`, `silver-emporium.svg`, `a-paramount.svg`,
  `kundan-jewellers.svg`, `jatubhai-velji.svg`, `signi.svg`, `tarava.svg`

Then point that case's `logo` field (in `lib/cases.tsx`) at `/logos/<slug>.svg`.
SVG or PNG both work — use a version that reads on the card's background
(most cards are dark, so a white/light logo is best).

The featured card shows this logo at rest and reveals the case info on hover.
If the file is missing, the card falls back to showing the brand name.

## Keeping every logo the same visual size

The PNGs in this folder are **generated** — don't hand-edit them. Source files
(with whatever padding/aspect they came with) live in `/logo-src`. To balance a
new or updated logo:

1. Drop the raw file into `/logo-src` named `<slug>.png`.
2. Run `node scripts/normalize-logos.mjs` from the project root.

The script trims each logo to its ink, scales it to a consistent optical size
(so a wide wordmark and a stacked mark read as "the same size"), and re-centres
it on one fixed-aspect canvas. Because every output shares that aspect, the CSS
box renders them all identically — no per-logo CSS tweaking needed.
