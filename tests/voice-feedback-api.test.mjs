import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { PassThrough } from "node:stream";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const source = ts.transpileModule(fs.readFileSync("app/api/voice-feedback/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const ID = "00000000-0000-4000-8000-000000000001";
const PATH = `2026-11-16/${ID}.webm`;
const ROW = { id: ID, storage_path: PATH };
const START = Date.parse("2026-11-16T00:00:00Z");
const reply = (data = null, status = 200) => new Response(data === null ? null : JSON.stringify(data), { status });
const ok = () => reply(null, 201);
const allowed = () => reply(true);
const present = () => reply([ROW]);
const absent = () => reply([]);
const disconnected = () => { throw new TypeError("Synthetic connection reset"); };
const rejected = () => reply({ code: "23514" }, 400);
const hanging = (_url, { signal }) => new Promise((_, reject) => {
  signal.addEventListener("abort", () => reject(signal.reason), { once: true });
});

// The real handler and Web Request/FormData implementation run in an isolated VM.
// Every provider call must consume an explicit fixture; there is no network fallback.
function harness(steps = [], env = {}) {
  const calls = [], logs = [], timers = new Map();
  let now = START, timerId = 0;
  const module = { exports: {} };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  vm.runInNewContext(source, {
    require: name => name === "node:crypto" ? { ...require(name), randomUUID: () => ID } : require(name),
    module, exports: module.exports, File, FormData, Response, Uint8Array, URL, AbortSignal, AbortController,
    Date: Clock, console: { warn: (...args) => logs.push(args) },
    process: { env: {
      NODE_ENV: "production",
      APAR_VOICE_SUPABASE_URL: "https://msqfxdqeilrzmsddlxwl.supabase.co",
      APAR_VOICE_SUPABASE_SECRET_KEY: "sb_secret_offline_fixture_not_a_credential",
      ...env,
    } },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, due: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: async (url, options) => {
      assert.ok(options.signal, "Each provider operation must be cancellable");
      calls.push({ url, ...options });
      const step = steps.shift();
      assert.ok(step, "Unexpected provider operation (real network is disabled)");
      return step(url, options);
    },
  });
  return {
    post: module.exports.POST, calls, logs,
    advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); }
    },
    elapsed: () => now - START,
    verify() { assert.equal(steps.length, 0, "Unused provider fixtures"); assert.equal(timers.size, 0, "Leaked deadline timers"); },
  };
}

function request({ edit, headers = {}, signal, url = "http://localhost:3021/api/voice-feedback" } = {}) {
  const form = new FormData();
  const bytes = new Uint8Array(300); bytes.set([0x1a, 0x45, 0xdf, 0xa3]);
  form.set("name", "Synthetic Client"); form.set("brand", "Fixture");
  form.set("duration", "2"); form.set("consent", "yes"); form.set("website", "");
  form.set("recording", new File([bytes], "fixture.webm", { type: "audio/webm;codecs=opus" }));
  edit?.(form);
  return new NextRequest(url, { method: "POST", body: form, signal, headers: { origin: "https://apar.agency", ...headers } });
}

async function waitFor(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.fail("Expected operation did not start");
}

test("public origin allowlist works with internal URLs and preserves the success contract", async () => {
  for (const origin of ["https://apar.agency", "https://www.apar.agency", "https://apar-one-front.vercel.app", "https://preview.example"]) {
    const api = harness([allowed, ok, ok], { APAR_VOICE_ALLOWED_ORIGINS: "https://preview.example/" });
    const result = await api.post(request({ headers: { origin } }));
    assert.equal(result.status, 201);
    assert.deepEqual(await result.json(), { ok: true, id: ID });
    assert.equal(result.headers.get("cache-control"), "no-store");
    const saved = JSON.parse(api.calls[2].body);
    assert.equal(saved.storage_path, PATH);
    assert.equal(saved.name, "Synthetic Client");
    api.verify();
  }
});

test("the installed self-hosted Next request adapter cannot turn a trusted public origin into a 403", async () => {
  const NextNodeServer = require("next/dist/server/next-server").default;
  const { NodeNextRequest } = require("next/dist/server/base-http/node");
  const { NextRequestAdapter } = require("next/dist/server/web/spec-extension/adapters/next-request");
  const incoming = new PassThrough();
  incoming.url = "/api/voice-feedback"; incoming.method = "POST";
  incoming.headers = { origin: "https://apar.agency", host: "apar.agency", "x-forwarded-proto": "https" };
  const req = new NodeNextRequest(incoming);
  NextNodeServer.prototype.attachRequestMeta.call({ fetchHostname: "127.0.0.1", port: 3021, nextConfig: { experimental: {} } }, req, { query: {} }, true);
  const adapted = NextRequestAdapter.fromNodeNextRequest(req, new AbortController().signal);
  const api = harness([], { APAR_VOICE_SUPABASE_SECRET_KEY: "" });
  try {
    assert.notEqual(adapted.nextUrl.origin, "https://apar.agency");
    assert.equal((await api.post(adapted)).status, 503, "Should reach configuration validation, not reject the public origin");
  } finally { incoming.destroy(); }
  api.verify();
});

test("untrusted, null and malformed origins cannot use forged proxy headers", async () => {
  for (const origin of ["https://evil.example", "null", "https://apar.agency.evil.example", "https://apar.agency/path", "https://user@apar.agency"]) {
    const api = harness();
    const result = await api.post(request({ headers: { origin, host: "apar.agency", "x-forwarded-host": "apar.agency" } }));
    assert.equal(result.status, 403);
    api.verify();
  }
});

test("loopback origins are automatic only in development; production can explicitly allow local previews", async () => {
  for (const origin of ["http://localhost:3021", "http://127.0.0.1:3000", "http://[::1]:3021"]) {
    const prod = harness();
    assert.equal((await prod.post(request({ headers: { origin } }))).status, 403); prod.verify();
    const dev = harness([allowed, ok, ok], { NODE_ENV: "development" });
    assert.equal((await dev.post(request({ headers: { origin } }))).status, 201); dev.verify();
    const explicit = harness([allowed, ok, ok], { APAR_VOICE_ALLOWED_ORIGINS: origin });
    assert.equal((await explicit.post(request({ headers: { origin } }))).status, 201); explicit.verify();
  }
});

test("invalid origin configuration and missing provider configuration fail closed", async () => {
  for (const env of [{ APAR_VOICE_ALLOWED_ORIGINS: "*" }, { APAR_VOICE_ALLOWED_ORIGINS: "http://public.example" }, { APAR_VOICE_SUPABASE_URL: "https://other.invalid" }, { APAR_VOICE_SUPABASE_SECRET_KEY: "" }]) {
    const api = harness([], env);
    assert.equal((await api.post(request())).status, 503); api.verify();
  }
});

test("non-browser clients without Origin retain the existing API contract", async () => {
  const api = harness([allowed, ok, ok]);
  const req = request(); req.headers.delete("origin");
  assert.equal((await api.post(req)).status, 201); api.verify();
});

test("oversized chunked multipart bodies are stopped before fully reading or calling providers", async () => {
  for (const length of [null, "1"]) {
    const source = request({ edit: form => form.append("ignored", new File([new Uint8Array(6 * 1024 * 1024)], "extra.bin")) });
    const bytes = new Uint8Array(await source.arrayBuffer());
    let offset = 0, cancelled = false;
    const stream = new ReadableStream({
      pull(controller) {
        if (offset >= bytes.length) return controller.close();
        const end = Math.min(bytes.length, offset + 32_768);
        controller.enqueue(bytes.slice(offset, end)); offset = end;
      },
      cancel() { cancelled = true; },
    });
    const headers = { origin: "https://apar.agency", "content-type": source.headers.get("content-type") };
    if (length !== null) headers["content-length"] = length;
    const req = new NextRequest("https://apar.agency/api/voice-feedback", { method: "POST", body: stream, duplex: "half", headers });
    const api = harness();
    assert.equal((await api.post(req)).status, 413);
    assert.equal(cancelled, true); assert.ok(offset < bytes.length); api.verify();
  }
});

test("unexpected fields, duplicate fields and file-valued text fields are rejected", async () => {
  const edits = [
    form => form.append("extra", "value"),
    form => form.append("name", "another name"),
    form => form.append("recording", form.get("recording")),
    form => form.append("website", ""),
    form => form.set("name", new File(["xx"], "name.txt")),
  ];
  for (const edit of edits) {
    const api = harness();
    assert.equal((await api.post(request({ edit }))).status, 400); api.verify();
  }
});

test("malformed bodies, MIME types, signatures and invalid consent or duration never reach storage", async () => {
  const edits = [
    form => form.set("consent", "no"), form => form.set("duration", "61"),
    form => form.set("recording", new File([new Uint8Array(300)], "wrong.webm", { type: "audio/webm" })),
    form => form.set("recording", new File([new Uint8Array(300)], "wrong.bin", { type: "constructor" })),
  ];
  for (const edit of edits) {
    const api = harness(); assert.equal((await api.post(request({ edit }))).status, 400); api.verify();
  }
  for (const headers of [{ "content-type": "application/json" }, { "content-type": "multipart/form-data; boundary=wrong" }, { "content-length": "not-a-number" }]) {
    const api = harness(); assert.equal((await api.post(request({ headers }))).status, 400); api.verify();
  }
});

test("the 4 MiB recording boundary is accepted with bounded multipart overhead", async () => {
  const bytes = new Uint8Array(4 * 1024 * 1024); bytes.set([0x1a, 0x45, 0xdf, 0xa3]);
  const api = harness([allowed, ok, ok]);
  const result = await api.post(request({ edit: form => form.set("recording", new File([bytes], "limit.webm", { type: "audio/webm" })) }));
  assert.equal(result.status, 201); api.verify();
});

test("MP4 and Ogg recordings preserve their supported MIME and storage extensions", async () => {
  for (const [mime, extension, signature, offset] of [["audio/mp4", "m4a", "ftyp", 4], ["audio/ogg;codecs=opus", "ogg", "OggS", 0]]) {
    const bytes = new Uint8Array(300);
    bytes.set(new TextEncoder().encode(signature), offset);
    const api = harness([allowed, ok, ok]);
    const result = await api.post(request({ edit: form => form.set("recording", new File([bytes], `fixture.${extension}`, { type: mime })) }));
    assert.equal(result.status, 201);
    const saved = JSON.parse(api.calls[2].body);
    assert.equal(saved.mime_type, mime.split(";")[0]);
    assert.equal(saved.storage_path, `2026-11-16/${ID}.${extension}`);
    api.verify();
  }
});

test("filled honeypots return 202 without provider work", async () => {
  const api = harness();
  const result = await api.post(request({ edit: form => form.set("website", "bot.invalid") }));
  assert.equal(result.status, 202); assert.deepEqual(await result.json(), { ok: true }); api.verify();
});

test("slow request streams time out and are cancelled", async () => {
  let started = false, cancelled = false;
  const body = new ReadableStream({ pull() { started = true; }, cancel() { cancelled = true; } });
  const req = new NextRequest("https://apar.agency/api/voice-feedback", { method: "POST", duplex: "half", body,
    headers: { origin: "https://apar.agency", "content-type": "multipart/form-data; boundary=fixture" } });
  const api = harness(); const result = api.post(req);
  await waitFor(() => started); api.advance(8_000);
  assert.equal((await result).status, 408); assert.equal(cancelled, true); api.verify();
});

test("rate-limit denial, invalid provider JSON and stalled response bodies fail before upload", async () => {
  for (const [value, status] of [[false, 429], [{ allowed: true }, 503], [null, 503]]) {
    const api = harness([() => reply(value)]);
    assert.equal((await api.post(request())).status, status); api.verify();
  }
  const api = harness([() => ({ ok: true, status: 200, json: () => new Promise(() => {}) })]);
  const result = api.post(request()); await waitFor(() => api.calls.length === 1); api.advance(3_000);
  assert.equal((await result).status, 503); assert.equal(api.calls[0].signal.aborted, true); api.verify();
});

test("upload timeout is bounded and reports uncertainty without attempting metadata", async () => {
  const api = harness([allowed, hanging]); const result = api.post(request());
  await waitFor(() => api.calls.length === 2); api.advance(6_000);
  const response = await result;
  assert.equal(response.status, 502); assert.match((await response.json()).error, /may have reached/);
  assert.equal(api.calls[1].signal.aborted, true); assert.equal(api.logs[0][1].stage, "upload"); api.verify();
});

test("a lost metadata acknowledgement reconciles an already committed row as success", async () => {
  const api = harness([allowed, ok, disconnected, present]);
  assert.equal((await api.post(request())).status, 201);
  assert.ok(api.calls[3].url.includes(`id=eq.${ID}`));
  assert.equal(api.calls.some(call => call.method === "DELETE"), false); api.verify();
});

test("HTTP 5xx and duplicate-conflict responses are reconciled, never treated as safe deletion", async () => {
  for (const failure of [() => reply({}, 503), () => reply({ code: "23505" }, 409)]) {
    const api = harness([allowed, ok, failure, present]);
    assert.equal((await api.post(request())).status, 201);
    assert.equal(api.calls.some(call => call.method === "DELETE"), false); api.verify();
  }
});

test("metadata timeout retries the same ID without overwriting and confirms the saved path", async () => {
  const api = harness([allowed, ok, hanging, absent, ok, present]);
  const result = api.post(request()); await waitFor(() => api.calls.length === 3); api.advance(4_000);
  assert.equal((await result).status, 201);
  assert.equal(api.calls[2].signal.aborted, true);
  assert.equal(api.calls[4].body, api.calls[2].body);
  assert.match(api.calls[4].url, /on_conflict=id$/);
  assert.equal(api.calls[4].headers.Prefer, "resolution=ignore-duplicates,return=minimal");
  assert.equal(api.calls.some(call => call.method === "DELETE"), false); api.verify();
});

test("an empty read followed by a late commit is reconciled without deleting its audio", async () => {
  const api = harness([allowed, ok, disconnected, absent, disconnected, present]);
  assert.equal((await api.post(request())).status, 201);
  assert.equal(api.calls.some(call => call.method === "DELETE"), false); api.verify();
});

test("empty, failed, mismatched or malformed reconciliation never permits ambiguous cleanup", async () => {
  for (const lookup of [absent, disconnected, () => reply([{ ...ROW, storage_path: "different.webm" }]), () => reply({})]) {
    const api = harness([allowed, ok, disconnected, lookup, rejected, lookup]);
    const response = await api.post(request());
    assert.equal(response.status, 502); assert.match((await response.json()).error, /before resending/);
    assert.equal(api.calls.some(call => call.method === "DELETE"), false);
    assert.deepEqual(JSON.parse(JSON.stringify(api.logs)), [["voice_feedback_reconciliation_needed", { id: ID, stage: "metadata" }]]);
    api.verify();
  }
});

test("definitive insert rejection requires confirmed absence before cleanup and retries failed deletion", async () => {
  const api = harness([allowed, ok, rejected, absent, () => reply({}, 503), ok]);
  assert.equal((await api.post(request())).status, 502);
  assert.equal(api.calls[4].method, "DELETE"); assert.equal(api.calls[5].method, "DELETE");
  assert.equal(api.calls[4].url, api.calls[1].url); assert.equal(api.logs.length, 0); api.verify();
  const unknown = harness([allowed, ok, rejected, disconnected]);
  assert.equal((await unknown.post(request())).status, 502);
  assert.equal(unknown.calls.some(call => call.method === "DELETE"), false); unknown.verify();
});

test("failed cleanup is retained for operator reconciliation with sanitized diagnostics", async () => {
  const api = harness([allowed, ok, rejected, absent, disconnected, disconnected]);
  assert.equal((await api.post(request())).status, 502);
  assert.deepEqual(JSON.parse(JSON.stringify(api.logs)), [["voice_feedback_reconciliation_needed", { id: ID, stage: "cleanup" }]]);
  api.verify();
});

test("client disconnection after upload cannot interrupt metadata reconciliation", async () => {
  const controller = new AbortController();
  const api = harness([allowed, ok, () => { controller.abort(); return disconnected(); }, present]);
  assert.equal((await api.post(request({ signal: controller.signal }))).status, 201);
  assert.equal(api.calls[2].signal.aborted, false); assert.equal(api.calls[3].signal.aborted, false); api.verify();
});

test("all provider stages share a hard twenty-second budget, including final reconciliation", async () => {
  let reserve, upload;
  const api = harness([() => new Promise(resolve => { reserve = resolve; }), () => new Promise(resolve => { upload = resolve; }), hanging, hanging, hanging, hanging]);
  const result = api.post(request());
  await waitFor(() => reserve); api.advance(2_999); reserve(reply(true));
  await waitFor(() => upload); api.advance(5_999); upload(ok());
  await waitFor(() => api.calls.length === 3); api.advance(4_000);
  await waitFor(() => api.calls.length === 4); api.advance(2_000);
  await waitFor(() => api.calls.length === 5); api.advance(4_000);
  await waitFor(() => api.calls.length === 6); api.advance(1_002);
  assert.equal((await result).status, 502); assert.equal(api.elapsed(), 20_000);
  assert.equal(api.calls.some(call => call.method === "DELETE"), false); api.verify();
});
