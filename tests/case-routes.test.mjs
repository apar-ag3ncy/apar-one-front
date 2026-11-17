import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { loadTypeScript } from "./load-typescript.mjs";

const require = createRequire(import.meta.url);
const cases = loadTypeScript("lib/cases/index.ts");
const assets = loadTypeScript("lib/cases/assets.server.ts");
const missingSlugs = ["", "not-a-case", ...Object.getOwnPropertyNames(Object.prototype)];

function routeHarness() {
  const assetCalls = [];
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync("app/work/[slug]/page.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  // Execute the actual route, catalogue, asset lookup and Next notFound helper.
  // Only the visual component is replaced: no browser or client effects are needed.
  const localRequire = name => {
    if (name === "@/lib/cases") return cases;
    if (name === "@/lib/cases/assets.server") return {
      caseAssets(...args) { assetCalls.push(args); return assets.caseAssets(...args); },
    };
    if (name === "@/components/work/case-study") return { CaseStudy: () => null };
    return require(name);
  };
  new Function("require", "module", "exports", source)(localRequire, module, module.exports);
  return { ...module.exports, assetCalls };
}

test("case accessor rejects inherited object keys and preserves every registered case", () => {
  for (const slug of missingSlugs) assert.equal(cases.getCase(slug), undefined, slug);
  for (const slug of cases.CASE_SLUGS) assert.equal(cases.getCase(slug), cases.CASES[slug], slug);
});

test("unknown and inherited case slugs produce empty metadata and Next 404s before asset lookup", async () => {
  const route = routeHarness();
  for (const slug of missingSlugs) {
    const input = { params: Promise.resolve({ slug }) };
    assert.deepEqual(await route.generateMetadata(input), {}, `metadata for ${slug}`);
    await assert.rejects(route.default(input), error => error.digest === "NEXT_HTTP_ERROR_FALLBACK;404", `page for ${slug}`);
  }
  assert.equal(route.assetCalls.length, 0);
});

test("registered case routes retain static params, metadata and gallery data", async () => {
  const route = routeHarness();
  assert.deepEqual(route.generateStaticParams(), cases.CASE_SLUGS.map(slug => ({ slug })));
  for (const slug of cases.CASE_SLUGS) {
    const input = { params: Promise.resolve({ slug }) };
    const data = cases.CASES[slug];
    assert.deepEqual(await route.generateMetadata(input), {
      title: `${data.card.name} - APAR Case Study`, description: data.sub,
    });
    const element = await route.default(input);
    assert.equal(element.props.data, data);
    assert.equal(element.props.assets.photos.length, data.approach.gallery.length);
  }
  assert.equal(route.assetCalls.length, cases.CASE_SLUGS.length);
});
