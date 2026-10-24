import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { sourceGraph } from "../scripts/lib/source-analysis.mjs";
import { loadTypeScript } from "./load-typescript.mjs";

const { CASES, CASE_SLUGS, FEATURED_CLIENTS } = loadTypeScript("lib/cases/index.ts");
const { CURATED_CASE_MEDIA } = loadTypeScript("lib/cases/motion.ts");
const { caseAssets } = loadTypeScript("lib/cases/assets.server.ts");
const assetExists = src => fs.existsSync(`public${src}`);

test("case routes, card identities and next-case links remain connected", () => {
  assert.ok(CASE_SLUGS.length > 0);
  assert.equal(new Set(FEATURED_CLIENTS.map(client => client.slug)).size, CASE_SLUGS.length);
  for (const slug of CASE_SLUGS) {
    const data = CASES[slug];
    assert.equal(data.slug, slug);
    const next = data.next.href;
    const destinationExists = next.startsWith("/work/")
      ? !!CASES[next.slice("/work/".length)]
      : fs.existsSync(`app${next}/page.tsx`);
    assert.ok(destinationExists, `${slug}: next destination is missing`);
    assert.ok(assetExists(data.logo ?? `/logos/${slug}.png`), `${slug}: logo is missing`);
    const assets = caseAssets(slug, data.approach.gallery.length);
    assert.equal(assets.photos.length, data.approach.gallery.length);
    for (const src of [assets.heroSrc, ...assets.photoSrcs].filter(Boolean)) assert.ok(assetExists(src), src);
    for (const ratio of [assets.heroRatio, ...assets.photoRatios].filter(value => value !== undefined)) {
      assert.ok(Number.isFinite(ratio) && ratio > 0, `${slug}: invalid image ratio`);
    }
    for (const item of data.approach.gallery) if (item.video) assert.ok(assetExists(item.video), item.video);
  }
});

test("all curated image references exist without downloading external resources", () => {
  for (const media of Object.values(CURATED_CASE_MEDIA)) {
    for (const src of [media.hero, ...media.photos].filter(Boolean)) assert.ok(assetExists(src), src);
  }
});

test("client bundles cannot import the full case catalogue or server file access", () => {
  const graph = sourceGraph();
  for (const [entry, module] of graph) {
    if (!module.client) continue;
    const seen = new Set();
    const visit = file => {
      if (seen.has(file)) return;
      seen.add(file);
      const node = graph.get(file);
      assert.ok(!node.server, `${entry} reaches server-only ${file}`);
      for (const dependency of node.imports) {
        if (dependency.typeOnly) continue;
        assert.ok(!["node:fs", "fs", "node:crypto"].includes(dependency.specifier), `${entry} reaches ${dependency.specifier}`);
        if (dependency.target) visit(dependency.target);
      }
    };
    visit(entry);
  }
});

test("all local source imports resolve after folder moves", () => {
  for (const [file, node] of sourceGraph()) for (const dependency of node.imports) {
    const specifier = dependency.specifier;
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) continue;
    if (specifier.endsWith(".css")) continue; // Next validates stylesheet imports during production compilation.
    assert.ok(dependency.target, `${file}: unresolved ${specifier}`);
  }
});
