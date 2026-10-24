# Editable originals

This folder is not a public URL. It preserves source material used to prepare the website's production assets.

- `blender/`: editable Manifesto sculpture. Rebuild with `scripts/blender/manifesto-sculpture.py` inside Blender; exports go to `public/models/`.
- `logos/`: supplied original brand marks. `scripts/normalize-logos.mjs` writes prepared copies to `public/logos/`.
- `glyphs/`: original glyph reference images used when tracing the APAR wordmark.
- `fonts/`: unused font experiments and original font files moved out of `public/`; retained with their supplied license file. They are not loaded by the current website.

The active APAR logo fonts are still in `public/fit-devnagari/`. Active editorial WOFF2 files and their licenses remain in `public/fonts/editorial/`. Do not replace those fonts when editing unrelated artwork.

Large raw client photos remain in the ignored local campaign directories in the project root. Only approved optimized exports belong in `public/`. `.vercelignore` excludes this source folder from direct CLI uploads.
