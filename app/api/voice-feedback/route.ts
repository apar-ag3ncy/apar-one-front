import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BUCKET = "client-voice-feedback";
const PROJECT_URL = "https://msqfxdqeilrzmsddlxwl.supabase.co";
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_BYTES + 64_000;
const FIELDS = new Set(["name", "brand", "duration", "consent", "website", "recording"]);
const PUBLIC_ORIGINS = ["https://apar.agency", "https://www.apar.agency", "https://apar-one-front.vercel.app"];
const SAVE_ERROR = "The recording could not be saved. Please try again.";
const UNCERTAIN_ERROR = "Delivery could not be confirmed. Your note may have reached us; please check with our team before resending.";
const formats: Record<string, { extension: string; signature: (bytes: Uint8Array) => boolean }> = {
  "audio/webm": { extension: "webm", signature: b => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  "audio/mp4": { extension: "m4a", signature: b => String.fromCharCode(...b.slice(4, 8)) === "ftyp" },
  "audio/ogg": { extension: "ogg", signature: b => String.fromCharCode(...b.slice(0, 4)) === "OggS" },
};

function response(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function loopback(url: URL) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

function publicOrigin(value: string) {
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback(url)))) {
    throw new Error("Invalid public origin configuration");
  }
  return url;
}

function allowedOrigin(origin: string | null) {
  const allowed = new Set(PUBLIC_ORIGINS);
  for (const value of (process.env.APAR_VOICE_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean)) {
    allowed.add(publicOrigin(value).origin);
  }
  // Retain non-browser clients. This public endpoint uses no cookie authentication.
  if (!origin) return true;
  try {
    const url = publicOrigin(origin);
    return allowed.has(url.origin) || (process.env.NODE_ENV === "development" && loopback(url));
  } catch { return false; }
}

class DeadlineError extends Error {}
class BodyTooLargeError extends Error {}

async function within<T>(milliseconds: number, work: (signal: AbortSignal) => Promise<T>, parent?: AbortSignal): Promise<T> {
  if (milliseconds <= 0) throw new DeadlineError();
  const controller = new AbortController();
  const signal = parent ? AbortSignal.any([parent, controller.signal]) : controller.signal;
  const timer = setTimeout(() => controller.abort(new DeadlineError()), milliseconds);
  let onAbort: () => void = () => {};
  try {
    signal.throwIfAborted();
    const aborted = new Promise<never>((_, reject) => {
      onAbort = () => reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
    });
    // Also bound response-body reads, rather than only waiting for HTTP headers.
    return await Promise.race([work(signal), aborted]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  }
}

async function readForm(request: NextRequest, contentType: string) {
  if (!request.body) throw new Error("Missing body");
  const reader = request.body.getReader();
  try {
    return await within(8_000, async signal => {
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        signal.throwIfAborted();
        const { done, value } = await reader.read();
        signal.throwIfAborted();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_REQUEST_BYTES) throw new BodyTooLargeError();
        chunks.push(value);
      }
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      return new Response(body, { headers: { "Content-Type": contentType } }).formData();
    }, request.signal);
  } finally {
    // A malicious/slow stream must not keep being read after rejection or timeout.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

type ProviderResult = { ok: boolean; status: number; data: unknown };

// Only explicit database rejections prove that the insert cannot later commit.
// A timeout, 5xx, duplicate conflict, or an empty GET alone does not prove that.
function rejectedInsert(result: ProviderResult | undefined) {
  if (!result || result.ok || result.status < 400 || result.status >= 500 || !result.data || typeof result.data !== "object") return false;
  const code = "code" in result.data ? result.data.code : undefined;
  return ["23502", "23503", "23514", "22P02", "22001", "42501"].includes(String(code));
}

export async function POST(request: NextRequest) {
  try {
    if (!allowedOrigin(request.headers.get("origin"))) return response("Invalid request origin.", 403);
  } catch {
    console.warn("voice_feedback_origin_configuration_invalid");
    return response("Voice feedback is temporarily unavailable.", 503);
  }
  const url = process.env.APAR_VOICE_SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.APAR_VOICE_SUPABASE_SECRET_KEY;
  // Fail closed if a deployment accidentally points at a different Supabase project.
  if (url !== PROJECT_URL || !secret?.startsWith("sb_secret_")) {
    return response("Voice feedback is temporarily unavailable.", 503);
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) return response("Could not read the recording.", 400);
  const length = request.headers.get("content-length");
  if (length !== null && !/^\d+$/.test(length)) return response("Could not read the recording.", 400);
  if (length !== null && Number(length) > MAX_REQUEST_BYTES) return response("Recording is too large (4 MB maximum).", 413);

  let form: FormData;
  try { form = await readForm(request, contentType); } catch (cause) {
    if (cause instanceof BodyTooLargeError) return response("Recording is too large (4 MB maximum).", 413);
    if (cause instanceof DeadlineError) return response("The recording upload took too long. Please try again.", 408);
    return response("Could not read the recording.", 400);
  }
  const seen = new Set<string>();
  for (const [field, value] of form) {
    if (!FIELDS.has(field) || seen.has(field) || (field !== "recording" && typeof value !== "string")) {
      return response("The recording contains unexpected or duplicate fields.", 400);
    }
    seen.add(field);
  }
  // Honeypot: bots often fill every field. Do not store or expose their payload.
  if (form.get("website")) return NextResponse.json({ ok: true }, { status: 202, headers: { "Cache-Control": "no-store" } });
  const name = String(form.get("name") ?? "").trim();
  const brand = String(form.get("brand") ?? "").trim();
  const duration = Number(form.get("duration"));
  const file = form.get("recording");
  if (name.length < 2 || name.length > 80 || brand.length > 80 || form.get("consent") !== "yes") {
    return response("Add your name and agree to send the private recording.", 400);
  }
  if (!Number.isFinite(duration) || duration < 1 || duration > 60) return response("Record up to one minute of audio.", 400);
  if (!(file instanceof File) || file.size < 200 || file.size > MAX_BYTES) return response("Record a voice note under 4 MB.", 400);
  const mime = file.type.split(";")[0].toLowerCase();
  const format = Object.hasOwn(formats, mime) ? formats[mime] : undefined;
  if (!format) return response("This audio format is not supported.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!format.signature(bytes)) return response("The recording could not be verified.", 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  const headers = { apikey: secret, "Content-Type": "application/json" };
  // Body intake gets 8s; all provider work shares another 20s, below the client's
  // 30s wait. Reconciliation deliberately survives a client disconnect after upload.
  const deadline = Date.now() + 20_000;
  const provider = (target: string, init: RequestInit, budget: number, json = false, parent?: AbortSignal) =>
    within(Math.min(budget, deadline - Date.now()), async signal => {
      const result = await fetch(target, { ...init, cache: "no-store", signal });
      const data: unknown = json || !result.ok ? await result.json().catch(() => null) : null;
      if (!json && result.ok) await result.body?.cancel();
      signal.throwIfAborted();
      return { ok: result.ok, status: result.status, data };
    }, parent);

  try {
    const limit = await provider(`${url}/rest/v1/rpc/reserve_voice_feedback_submission`, {
      method: "POST", headers, body: JSON.stringify({ p_ip_hash: ipHash }),
    }, 3_000, true, request.signal);
    if (!limit.ok || typeof limit.data !== "boolean") return response("Voice feedback is temporarily unavailable.", 503);
    if (!limit.data) return response("Please wait before sending another recording.", 429);
  } catch {
    return response("Voice feedback is temporarily unavailable.", 503);
  }

  const id = randomUUID();
  const path = `${new Date().toISOString().slice(0, 10)}/${id}.${format.extension}`;
  const objectUrl = `${url}/storage/v1/object/${BUCKET}/${path}`;
  const metadataUrl = `${url}/rest/v1/client_voice_feedback`;
  const body = JSON.stringify({ id, name, brand: brand || null, duration_seconds: duration, mime_type: mime, storage_path: path });
  const success = () => NextResponse.json({ ok: true, id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  // Log opaque IDs only: never provider bodies, names, IPs, audio or credentials.
  const needsReview = (stage: string) => console.warn("voice_feedback_reconciliation_needed", { id, stage });

  try {
    const upload = await provider(objectUrl, {
      method: "POST", headers: { apikey: secret, "Content-Type": mime, "x-upsert": "false" }, body: bytes,
    }, 6_000, false, request.signal);
    if (!upload.ok) {
      if (upload.status >= 500 || upload.status === 408) needsReview("upload");
      return response(SAVE_ERROR, 502);
    }
  } catch {
    needsReview("upload");
    return response(UNCERTAIN_ERROR, 502);
  }

  const lookup = async () => {
    try {
      const result = await provider(`${metadataUrl}?id=eq.${id}&select=id,storage_path&limit=1`, { headers }, 2_000, true);
      if (!result.ok || !Array.isArray(result.data)) return "unknown";
      if (result.data.length === 0) return "absent";
      const row = result.data[0];
      return row?.id === id && row?.storage_path === path ? "present" : "unknown";
    } catch { return "unknown"; }
  };

  let save: ProviderResult | undefined;
  try {
    save = await provider(metadataUrl, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body }, 4_000);
    if (save.ok) return success();
  } catch { /* Reconcile a possibly committed insert, including a response timeout. */ }

  const state = await lookup();
  if (state === "present") return success();
  if (rejectedInsert(save)) {
    if (state === "absent") {
      // An explicit rollback plus a successful empty lookup makes deletion safe.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const removed = await provider(objectUrl, { method: "DELETE", headers: { apikey: secret } }, 2_000);
          if (removed.ok || removed.status === 404) return response(SAVE_ERROR, 502);
        } catch { /* Retry within the same overall deadline, then alert an operator. */ }
      }
      needsReview("cleanup");
    } else needsReview("metadata_lookup");
    return response(SAVE_ERROR, 502);
  }

  // A retry uses the SAME ID and object. ON CONFLICT serializes with an original
  // insert still in flight; it never overwrites a previously committed row.
  try {
    await provider(`${metadataUrl}?on_conflict=id`, {
      method: "POST", headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=minimal" }, body,
    }, 4_000);
  } catch { /* A failed retry is also ambiguous; verify rather than deleting. */ }
  if (await lookup() === "present") return success();
  // Even an empty lookup can race a late commit. Retain the private object if
  // certainty cannot be established without a durable reconciliation worker.
  needsReview("metadata");
  return response(UNCERTAIN_ERROR, 502);
}
