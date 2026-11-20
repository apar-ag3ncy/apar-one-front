import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseOptions, runSmoke } from "../scripts/check-http.mjs";

async function checkRoutes(t, overrides = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "apar-http-routes-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const files = {
    "app/page.tsx": "",
    "app/journey/page.tsx": "",
    "app/work/[slug]/page.tsx": "",
    "lib/cases/index.ts": "export const CASES = {\n chheda: chheda,\n};\n",
    "lib/client-voices.ts": "export const CLIENT_VOICES = [];\n",
  };
  for (const [file, source] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), source);
  }
  const html = '<html><head><title>APAR</title><link rel="stylesheet" href="/app.css"><link rel="preload" as="font" href="/font.woff2"></head><body><img src="/logo.svg"><script src="/app.js"></script></body></html>';
  const assets = {
    "/app.css": ["text/css", "body { color: black; }"],
    "/font.woff2": ["font/woff2", "wOF2fixture"],
    "/logo.svg": ["image/svg+xml", '<svg xmlns="http://www.w3.org/2000/svg"/>'],
    "/app.js": ["text/javascript", "void 0;"],
  };
  const transport = async (url, init) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/voice-feedback") {
      const status = init.method === "GET" ? 405 : init.headers.Origin === "https://http-smoke.invalid" ? 403 : 400;
      return new Response('{"error":"Invalid request"}', { status, headers: { "Content-Type": "application/json" } });
    }
    const asset = assets[pathname];
    if (asset) return new Response(asset[1], { headers: { "Content-Type": asset[0] } });
    const status = overrides[pathname] ?? (["/", "/work/chheda"].includes(pathname) ? 200 : 404);
    return new Response(html, { status, headers: { "Content-Type": "text/html" } });
  };
  return runSmoke(parseOptions(["https://fixture.invalid", "--source-root", root, "--require-voice"], {}), transport);
}

test("production smoke accepts the private journey preview's 404 while checking public pages", async t => {
  const report = await checkRoutes(t);
  assert.equal(report.summary.fail, 0, JSON.stringify(report.checks.filter(check => check.outcome !== "pass")));
  const journey = report.checks.filter(check => check.url === "https://fixture.invalid/journey");
  assert.equal(journey.length, 1);
  assert.equal(journey[0].expectedStatus, 404);
  assert.equal(journey[0].outcome, "pass");
  assert.ok(report.checks.some(check => check.url === "https://fixture.invalid/work/chheda" && check.outcome === "pass"));
});

test("production smoke fails if the private preview is exposed or a public case disappears", async t => {
  const report = await checkRoutes(t, { "/journey": 200, "/work/chheda": 404 });
  const failures = report.checks.filter(check => check.outcome === "fail");
  assert.equal(failures.length, 2);
  assert.ok(failures.some(check => check.url.endsWith("/journey") && check.issues.includes("Expected 404, received 200")));
  assert.ok(failures.some(check => check.url.endsWith("/work/chheda") && check.issues.includes("Expected 200, received 404")));
});
