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
