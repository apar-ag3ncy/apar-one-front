#!/usr/bin/env node
/**
 * HTTP-only smoke checks; no browser, JS execution, private data or valid uploads.
 * node scripts/check-http.mjs [URL] [--report report.json]
 * BASE_URL=http://127.0.0.1:3021 node scripts/check-http.mjs
 * Use --source-root /path/to/release/source when checking an isolated build.
 * Exit 0: no failures (inspect warnings); 1: failed checks; 2: setup/usage error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEVELOPMENT_ONLY_ROUTES } from "./lib/production-routes.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const TEXT_LIMIT = 4 * 1024 * 1024;
const SAMPLE_LIMIT = 8192;
const HELP = `HTTP-only APAR production smoke checker (Node 22+)
Usage: node scripts/check-http.mjs [URL] [options]
  --base-url URL       Target origin; otherwise BASE_URL or http://127.0.0.1:3021
  --source-root PATH   Matching release source directory (default: script's repo)
  --report PATH        Optional JSON report; no file is written by default
  --timeout-ms N       Per-request deadline including redirects/body (default 10000, max 60000)
  --concurrency N      Concurrent HTTP requests (default 4, max 12)
  --max-assets N       Asset discovery cap; exceeding it FAILS (default 2000, max 10000)
  --require-voice      Treat unavailable voice configuration (503) as failure
  --voice-disabled    Require every voice API probe to return the launch-disabled response
  --help              Show this help without making requests

Checks source app routes/cases, missing/inherited 404s, HTML/CSS asset references,
and approved public audio paths from lib/client-voices.ts. Assets use bounded GET
samples, MIME checks and binary signatures to reject HTML soft-404s. CSS is read
fully up to 4 MiB to discover font/image/import references. External assets and
redirects are never fetched. API POSTs contain NO audio and NO consent; they can
only exercise rejection paths, never submission persistence or rate reservation.
An unconfigured voice route is a warning, not evidence that validation passed.
This does not verify UI, hydration, playback, visual appearance or persistence.
`;

export function parseOptions(args = process.argv.slice(2), env = process.env) {
  const options = { baseUrl: env.BASE_URL || "http://127.0.0.1:3021", sourceRoot: ROOT,
    reportPath: null, timeoutMs: 10_000, concurrency: 4, maxAssets: 2000, requireVoice: false, voiceDisabled: false };
  const flags = { "--base-url": "baseUrl", "--source-root": "sourceRoot", "--report": "reportPath",
    "--timeout-ms": "timeoutMs", "--concurrency": "concurrency", "--max-assets": "maxAssets" };
  let positional = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--voice-disabled") { options.voiceDisabled = true; continue; }
    if (arg === "--require-voice") { options.requireVoice = true; continue; }
    if (Object.hasOwn(flags, arg)) {
      if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error(`Missing value for ${arg}`);
      options[flags[arg]] = args[++i];
    } else if (!arg.startsWith("-") && !positional) { options.baseUrl = arg; positional = true; }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (options.requireVoice && options.voiceDisabled) throw new Error("Voice cannot be both required and disabled");
  const base = new URL(options.baseUrl);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
    throw new Error("BASE_URL must be an HTTP(S) origin without credentials, path, query or fragment");
  }
  options.baseUrl = base.origin;
  options.sourceRoot = path.resolve(options.sourceRoot);
  if (options.reportPath) options.reportPath = path.resolve(options.reportPath);
  for (const [key, maximum] of [["timeoutMs", 60_000], ["concurrency", 12], ["maxAssets", 10_000]]) {
    options[key] = Number(options[key]);
    if (!Number.isInteger(options[key]) || options[key] < 1 || options[key] > maximum) throw new Error(`${key} must be 1–${maximum}`);
  }
  return options;
}

export function discoverTargets(root) {
  const source = fs.readFileSync(path.join(root, "lib/cases/index.ts"), "utf8");
  const block = source.match(/export\s+const\s+CASES\b[^=]*=\s*\{([\s\S]*?)^\};/m)?.[1];
  if (!block) throw new Error("Cannot locate the literal CASES catalogue in source");
  const slugs = block.split("\n").filter(line => line.trim()).map(line => {
    const match = line.match(/^\s*(?:"([^"]+)"|'([^']+)'|([\w$]+))\s*:\s*[\w$]+\s*,?\s*(?:\/\/.*)?$/);
    if (!match) throw new Error("CASES is no longer a literal slug-to-import map; update source discovery");
    return match[1] || match[2] || match[3];
  });
  if (!slugs.length || new Set(slugs).size !== slugs.length) throw new Error("Empty or duplicate case catalogue");
  const routes = new Set();
  function walk(dir, parts = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith("_") && !entry.name.startsWith("@")) walk(path.join(dir, entry.name), [...parts, entry.name]);
      } else if (/^page\.[jt]sx?$/.test(entry.name)) {
        const segments = parts.filter(part => !/^\(.*\)$/.test(part));
        if (segments.some(part => part.includes("["))) {
          if (segments.join("/") !== "work/[slug]") throw new Error(`Unsupported dynamic page: ${segments.join("/")}`);
          for (const slug of slugs) routes.add(`/work/${encodeURIComponent(slug)}`);
        } else routes.add(`/${segments.join("/")}`);
      }
    }
  }
  walk(path.join(root, "app"));
  if (!routes.has("/") || !slugs.every(slug => routes.has(`/work/${encodeURIComponent(slug)}`))) throw new Error("Missing home or case page source");
  // Public player audio is intentionally not assigned an HTML src until play.
  // Read only its approved public paths, never names, private rows or recordings.
  const voices = fs.readFileSync(path.join(root, "lib/client-voices.ts"), "utf8");
  const audio = [...voices.matchAll(/\bsrc\s*:\s*["'](\/audio\/[^"']+)["']/g)].map(match => match[1]);
  return { routes: [...routes].sort(), slugs, audio };
}

function entities(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (original, key) => {
    if (!key.startsWith("#")) return named[key.toLowerCase()] ?? original;
    const code = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : original;
  });
}

function attributes(text) {
  const result = Object.create(null);
  for (const match of text.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    result[match[1].toLowerCase()] = entities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function srcset(value) {
  const urls = [];
  let rest = value;
  while (rest.length) {
    rest = rest.replace(/^[\s,]+/, "");
    const match = rest.match(/^\S+/);
    if (!match) break;
    const url = match[0]; rest = rest.slice(url.length);
    urls.push(url.replace(/,+$/, ""));
    if (!url.endsWith(",")) { const comma = rest.indexOf(","); rest = comma < 0 ? "" : rest.slice(comma + 1); }
  }
  return urls;
}

function assetKind(url, fallback = "image") {
  const pathname = new URL(url, "http://fixture.invalid").pathname.toLowerCase();
  if (/\.(?:woff2?|ttf|otf|eot)$/.test(pathname)) return "font";
  if (/\.css$/.test(pathname)) return "style";
  if (/\.(?:m?js)$/.test(pathname)) return "script";
  if (/\.(?:m4a|mp3|wav|ogg|opus|aac|flac)$/.test(pathname)) return "audio";
  if (/\.(?:mp4|webm|mov)$/.test(pathname)) return fallback === "audio" ? "audio" : "video";
  return fallback;
}

export function cssReferences(css) {
  const found = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const unescape = value => value.replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, char) => hex ? String.fromCodePoint(parseInt(hex, 16) || 0xfffd) : char);
  for (const match of clean.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)) {
    const raw = unescape(match[1] ?? match[2] ?? match[3]);
    found.push({ raw, kind: assetKind(raw) });
  }
  for (const match of clean.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/gi)) found.push({ raw: unescape(match[1] ?? match[2]), kind: "style" });
  return found;
}

export function htmlReferences(html) {
  const found = [];
  // Raw script bodies (including RSC flight strings) are data, not HTML tags.
  const tags = /<!--[\s\S]*?-->|<(script|style|textarea|title)\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/\1\s*>|<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
  for (const match of html.matchAll(tags)) {
    const tag = (match[1] || match[4] || "").toLowerCase();
    const attr = attributes(match[2] ?? match[5] ?? "");
    const add = (raw, kind) => { if (raw) found.push({ raw, kind }); };
    if (attr.style) found.push(...cssReferences(attr.style));
    if (tag === "style") found.push(...cssReferences(match[3]));
    if (tag === "script") add(attr.src, "script");
    if (tag === "img") add(attr.src, "image");
    if (tag === "audio") add(attr.src, "audio");
    if (tag === "video") { add(attr.src, "video"); add(attr.poster, "image"); }
    if (tag === "source") add(attr.src, assetKind(attr.src || "", attr.type?.startsWith("audio/") ? "audio" : "video"));
    if (tag === "image") add(attr.href || attr["xlink:href"], "image");
    for (const name of ["srcset", "imagesrcset"]) if (attr[name]) for (const url of srcset(attr[name])) add(url, "image");
    if (tag === "link") {
      const rel = (attr.rel || "").toLowerCase().split(/\s+/);
      if (rel.includes("stylesheet")) add(attr.href, "style");
      else if (rel.includes("modulepreload")) add(attr.href, "script");
      else if (rel.includes("icon") || rel.includes("apple-touch-icon")) add(attr.href, "image");
      else if (rel.includes("preload") && ["image", "font", "script", "style", "audio", "video"].includes(attr.as)) add(attr.href, attr.as);
    }
  }
  return found;
}

async function pool(items, concurrency, worker) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) await worker(items[next++]);
  }));
}

async function readBody(response, limit, full) {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (full && size + value.length > limit) throw new Error(`Response exceeds ${limit} byte read limit`);
      const chunk = Buffer.from(value).subarray(0, limit - size);
      chunks.push(chunk); size += chunk.length;
      if (!full && size >= limit) break;
    }
    return Buffer.concat(chunks, size);
  } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
}

async function getResponse(url, init, options, transport, full = true) {
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const redirects = [];
  let current = url;
  try {
    for (let hop = 0; hop <= 3; hop++) {
      const response = await transport(current, { ...init, redirect: "manual", signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        void response.body?.cancel().catch(() => {});
        if (init.method === "POST") throw new Error("API POST redirect refused");
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect has no Location");
        const target = new URL(location, current);
        if (target.origin !== options.baseUrl || target.username || target.password) throw new Error("Cross-origin redirect refused");
        redirects.push({ status: response.status, to: target.href }); current = target.href; continue;
      }
      const body = await readBody(response, full ? TEXT_LIMIT : SAMPLE_LIMIT, full);
      return { status: response.status, contentType: (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase(),
        finalUrl: current, redirects, body, durationMs: Date.now() - started };
    }
    throw new Error("More than three redirects");
  } catch (error) {
    return { status: null, contentType: "", finalUrl: current, redirects, body: Buffer.alloc(0), durationMs: Date.now() - started,
      error: controller.signal.aborted ? `Timeout after ${options.timeoutMs} ms` : error.message };
  } finally { clearTimeout(timer); controller.abort(); }
}

export function checkAsset(kind, result) {
  const issues = [];
  if (![200, 206].includes(result.status)) issues.push(`Expected 200/206, received ${result.status}`);
  const mime = result.contentType;
  const types = {
    image: /^image\//, font: /^(?:font\/|application\/(?:font-woff|x-font-(?:woff|ttf|opentype|truetype)|vnd\.ms-fontobject)$)/,
    script: /^(?:text|application)\/(?:javascript|ecmascript|x-javascript)$/,
    style: /^text\/css$/, audio: /^(?:audio\/|video\/mp4$|application\/ogg$)/, video: /^video\//,
  };
  if (!types[kind]?.test(mime)) issues.push(`Unexpected ${kind} Content-Type: ${mime || "missing"}`);
  const b = result.body, head = b.subarray(0, 1024).toString("utf8").trimStart();
  if (!b.length) issues.push("Empty asset body");
  if (/^(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i.test(head)) issues.push("HTML body served as an asset (soft 404)");
  const ascii = (a, z) => b.toString("ascii", a, z);
  if (kind === "image" && b.length) {
    const known = b[0] === 0xff && b[1] === 0xd8 || b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
      /^GIF8/.test(ascii(0, 4)) || ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP" || /<svg\b/i.test(head) ||
      ascii(4, 8) === "ftyp" || b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0;
    if (!known) issues.push("Unrecognized image signature");
  }
  if (kind === "font" && b.length && !["wOFF", "wOF2", "OTTO", "ttcf", "\0\x01\0\0"].includes(ascii(0, 4)) && !(b[34] === 0x4c && b[35] === 0x50)) issues.push("Unrecognized font signature");
  if (["audio", "video"].includes(kind) && b.length && !(ascii(4, 8) === "ftyp" || ascii(0, 4) === "OggS" ||
      ascii(0, 4) === "RIFF" || ascii(0, 3) === "ID3" || ascii(0, 4) === "fLaC" || b[0] === 0xff && (b[1] & 0xe0) === 0xe0 ||
      b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)) issues.push("Unrecognized media signature");
  return issues;
}

export async function runSmoke(options, transport = fetch) {
  const targets = discoverTargets(options.sourceRoot);
  const checks = [], assets = new Map(), skippedExternal = new Set();
  let capExceeded = false;
  const add = (reference, from) => {
    const raw = reference.raw.trim();
    if (!raw || /^(?:#|data:|blob:|javascript:|mailto:)/i.test(raw)) return;
    let url;
    try { url = new URL(raw, from); } catch { checks.push({ kind: "discovery", url: from, outcome: "fail", issues: ["Malformed asset reference"] }); return; }
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return;
    if (url.origin !== options.baseUrl) { skippedExternal.add(url.origin); return; }
    url.hash = "";
    const key = `${reference.kind}:${url.href}`;
    if (!assets.has(key)) {
      if (assets.size >= options.maxAssets) { capExceeded = true; return; }
      assets.set(key, { kind: reference.kind, url: url.href, from: new Set(), checked: false });
    }
    assets.get(key).from.add(from);
  };
  const record = (kind, url, result, issues, extra = {}) => {
    const { body, ...details } = result;
    checks.push({ kind, url, ...details, sampledBytes: body.length, outcome: issues.length ? "fail" : "pass", issues, ...extra });
  };
  const missing = ["/__http-smoke-missing__", "/work/__http-smoke-missing__", ...Object.getOwnPropertyNames(Object.prototype).map(key => `/work/${encodeURIComponent(key)}`)];
  const pages = [...targets.routes.map(route => ({ route, expected: DEVELOPMENT_ONLY_ROUTES.has(route) ? 404 : 200 })), ...missing.map(route => ({ route, expected: 404 }))];
  await pool(pages, options.concurrency, async ({ route, expected }) => {
    const url = new URL(route, options.baseUrl).href;
    const result = await getResponse(url, { headers: { Accept: "text/html" } }, options, transport);
    const issues = result.error ? [result.error] : [];
    if (result.status !== expected) issues.push(`Expected ${expected}, received ${result.status}`);
    if (result.contentType !== "text/html") issues.push(`Expected text/html, received ${result.contentType || "missing"}`);
    const html = result.body.toString("utf8");
    if (!/<html\b/i.test(html) || !/<title\b/i.test(html)) issues.push("Missing HTML document/title");
    const canonical = value => new URL(value).pathname.replace(/\/$/, "") || "/";
    if (canonical(result.finalUrl) !== canonical(url)) issues.push("Route redirected to a different page");
    const title = entities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    if (expected === 200 && (!/AP[AĀ]R/i.test(title) || /page not found|application error|internal server error/i.test(title) || /data-screen-label=["'](?:404|Error)["']/i.test(html))) issues.push("Unexpected application document or error page");
    record(expected === 200 ? "route" : "not-found", url, result, issues, { expectedStatus: expected });
    if (result.contentType === "text/html" && result.status === expected) for (const ref of htmlReferences(html)) add(ref, result.finalUrl);
  });
  for (const raw of targets.audio) add({ raw, kind: "audio" }, `${options.baseUrl}/`);

  while (true) {
    const batch = [...assets.values()].filter(asset => !asset.checked);
    if (!batch.length) break;
    for (const asset of batch) asset.checked = true;
    await pool(batch, options.concurrency, async asset => {
      const full = asset.kind === "style";
      const result = await getResponse(asset.url, { headers: full ? {} : { Range: `bytes=0-${SAMPLE_LIMIT - 1}` } }, options, transport, full);
      const issues = [...(result.error ? [result.error] : []), ...checkAsset(asset.kind, result)];
      record("asset", asset.url, result, issues, { assetKind: asset.kind, from: [...asset.from] });
      if (asset.kind === "style" && !issues.length) for (const ref of cssReferences(result.body.toString("utf8"))) add(ref, result.finalUrl);
    });
  }
  if (capExceeded) checks.push({ kind: "discovery", outcome: "fail", issues: [`Asset cap ${options.maxAssets} exceeded; coverage is incomplete`] });
  const coverage = Object.fromEntries(["image", "font", "script", "style", "audio", "video"].map(kind => [kind, [...assets.values()].filter(asset => asset.kind === kind).length]));
  for (const kind of ["image", "font", "script", "style", ...(targets.audio.length ? ["audio"] : [])]) {
    if (!coverage[kind]) checks.push({ kind: "discovery", outcome: "fail", issues: [`No ${kind} references found; coverage is incomplete`] });
  }

  const apiUrl = `${options.baseUrl}/api/voice-feedback`;
  // Every POST omits the recording and explicitly withholds consent. Never add
  // a valid recording, honeypot success probe or a persistence test here.
  const invalidForm = () => { const form = new FormData(); form.set("name", ""); form.set("consent", "no"); form.set("duration", "0"); return form; };
  const duplicate = invalidForm(); duplicate.append("name", "invalid smoke fixture");
  const probes = [
    { name: "unsupported GET", init: { method: "GET" }, expected: 405 },
    { name: "untrusted origin", init: { method: "POST", headers: { Origin: "https://http-smoke.invalid", "Content-Type": "application/json" }, body: "{}" }, expected: 403 },
    { name: "invalid JSON body", init: { method: "POST", headers: { Origin: "https://apar.agency", "Content-Type": "application/json" }, body: "{}" }, expected: 400 },
    { name: "missing audio and consent", init: { method: "POST", headers: { Origin: "https://apar.agency" }, body: invalidForm() }, expected: 400 },
    { name: "duplicate field", init: { method: "POST", headers: { Origin: "https://apar.agency" }, body: duplicate }, expected: 400 },
  ];
  for (const probe of probes) {
    if (options.voiceDisabled) probe.expected = 410;
    const result = await getResponse(apiUrl, probe.init, options, transport);
    const issues = result.error ? [result.error] : [];
    let outcome;
    if (options.voiceDisabled) {
      if (result.status !== 410) issues.push(`Expected disabled status 410, received ${result.status}`);
      let payload;
      try { payload = JSON.parse(result.body.toString("utf8")); } catch {}
      if (result.contentType !== "application/json" || payload?.error !== "Voice feedback is disabled for this launch." || payload.ok === true) issues.push("Expected the explicit launch-disabled response");
    } else if (probe.init.method === "POST") {
      let payload;
      try { payload = JSON.parse(result.body.toString("utf8")); } catch { /* Report MIME/schema failure below. */ }
      if (result.contentType !== "application/json" || !payload || typeof payload.error !== "string" || !payload.error.trim() || payload.ok === true) issues.push("Expected a JSON error response");
      if (result.status === 503 && payload?.error === "Voice feedback is temporarily unavailable." && !issues.length && !options.requireVoice) {
        outcome = "warn"; issues.push("Voice configuration unavailable; validation was NOT exercised");
      } else if (result.status !== probe.expected) issues.push(`Expected ${probe.expected}, received ${result.status}`);
    } else if (result.status !== probe.expected) issues.push(`Expected ${probe.expected}, received ${result.status}`);
    record("api", apiUrl, result, issues, { probe: probe.name, expectedStatus: probe.expected, ...(outcome ? { outcome } : {}) });
  }
  checks.sort((a, b) => `${a.kind}:${a.url || ""}:${a.probe || ""}`.localeCompare(`${b.kind}:${b.url || ""}:${b.probe || ""}`));
  const counts = Object.fromEntries(["pass", "fail", "warn"].map(outcome => [outcome, checks.filter(check => check.outcome === outcome).length]));
  return { createdAt: new Date().toISOString(), baseUrl: options.baseUrl, sourceRoot: options.sourceRoot, httpOnly: true,
    source: { appRoutes: targets.routes.length - targets.slugs.length, cases: targets.slugs.length, caseSlugs: targets.slugs, publicAudioPaths: targets.audio.length },
    settings: { timeoutMs: options.timeoutMs, concurrency: options.concurrency, maxAssets: options.maxAssets, requireVoice: options.requireVoice, voiceDisabled: options.voiceDisabled },
    summary: { ...counts, checks: checks.length, outcome: counts.fail ? "fail" : counts.warn ? "pass-with-warnings" : "pass" },
    coverage: { ...coverage, skippedExternalOrigins: [...skippedExternal].sort(), assetCapExceeded: capExceeded },
    limitations: ["HTTP responses only; no UI, browser execution, hydration, playback or visual verification.",
      "Only HTML/CSS references and approved source audio are checked; JavaScript-only assets are not discovered.",
      "No valid voice submissions, provider persistence or private data are tested."], checks };
}

async function main() {
  const options = parseOptions();
  if (options.help) { console.log(HELP); return; }
  console.log(`HTTP-only smoke: ${options.baseUrl} | source: ${options.sourceRoot}`);
  const report = await runSmoke(options);
  if (options.reportPath) {
    fs.mkdirSync(path.dirname(options.reportPath), { recursive: true });
    fs.writeFileSync(options.reportPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`JSON report: ${options.reportPath}`);
  }
  console.log(`Source: ${report.source.appRoutes} app routes + ${report.source.cases} cases`);
  console.table(Object.fromEntries(["route", "not-found", "asset", "api", "discovery"].map(kind => [kind,
    Object.fromEntries(["pass", "fail", "warn"].map(outcome => [outcome, report.checks.filter(check => check.kind === kind && check.outcome === outcome).length]))])));
  for (const check of report.checks.filter(check => check.outcome !== "pass").slice(0, 30)) {
    console.log(`${check.outcome.toUpperCase()} ${check.probe || check.assetKind || check.kind} ${check.url || ""}: ${check.issues.join("; ")}`);
  }
  if (report.summary.fail + report.summary.warn > 30) console.log("Additional findings omitted from console; use --report for the complete results.");
  console.log(`${report.summary.outcome}: ${report.summary.pass} passed, ${report.summary.fail} failed, ${report.summary.warn} warnings. HTTP-only; no UI or persistence claims.`);
  process.exitCode = report.summary.fail ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`HTTP smoke setup failed: ${error.message}`); process.exitCode = 2; });
}
