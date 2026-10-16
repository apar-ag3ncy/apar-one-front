import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BUCKET = "client-voice-feedback";
const PROJECT_URL = "https://msqfxdqeilrzmsddlxwl.supabase.co";
const MAX_BYTES = 4 * 1024 * 1024;
const formats: Record<string, { extension: string; signature: (bytes: Uint8Array) => boolean }> = {
  "audio/webm": { extension: "webm", signature: b => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  "audio/mp4": { extension: "m4a", signature: b => String.fromCharCode(...b.slice(4, 8)) === "ftyp" },
  "audio/ogg": { extension: "ogg", signature: b => String.fromCharCode(...b.slice(0, 4)) === "OggS" },
};

function response(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return response("Invalid request origin.", 403);
  const url = process.env.APAR_VOICE_SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.APAR_VOICE_SUPABASE_SECRET_KEY;
  // Fail closed if a deployment accidentally points at a different Supabase project.
  if (url !== PROJECT_URL || !secret?.startsWith("sb_secret_")) {
    return response("Voice feedback is temporarily unavailable.", 503);
  }
  if (Number(request.headers.get("content-length")) > MAX_BYTES + 64_000) return response("Recording is too large (4 MB maximum).", 413);

  let form: FormData;
  try { form = await request.formData(); } catch { return response("Could not read the recording.", 400); }
  // Honeypot: bots often fill every field. Do not store or expose their payload.
  if (form.get("website")) return NextResponse.json({ ok: true }, { status: 202 });
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
  const format = formats[mime];
  if (!format) return response("This audio format is not supported.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!format.signature(bytes)) return response("The recording could not be verified.", 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  const headers = { apikey: secret, "Content-Type": "application/json" };
  try {
    const limit = await fetch(`${url}/rest/v1/rpc/reserve_voice_feedback_submission`, {
      method: "POST", headers, body: JSON.stringify({ p_ip_hash: ipHash }), cache: "no-store",
    });
    if (!limit.ok) return response("Voice feedback is temporarily unavailable.", 503);
    if (!(await limit.json())) return response("Please wait before sending another recording.", 429);

    const id = randomUUID();
    const path = `${new Date().toISOString().slice(0, 10)}/${id}.${format.extension}`;
    const objectUrl = `${url}/storage/v1/object/${BUCKET}/${path}`;
    const upload = await fetch(objectUrl, {
      method: "POST", headers: { apikey: secret, "Content-Type": mime, "x-upsert": "false" }, body: bytes, cache: "no-store",
    });
    if (!upload.ok) return response("The recording could not be saved. Please try again.", 502);

    const save = await fetch(`${url}/rest/v1/client_voice_feedback`, {
      method: "POST", headers: { ...headers, Prefer: "return=minimal" }, cache: "no-store",
      body: JSON.stringify({ id, name, brand: brand || null, duration_seconds: duration, mime_type: mime, storage_path: path }),
    });
    if (!save.ok) {
      await fetch(objectUrl, { method: "DELETE", headers: { apikey: secret }, cache: "no-store" }).catch(() => {});
      return response("The recording could not be saved. Please try again.", 502);
    }
    return NextResponse.json({ ok: true, id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return response("The recording could not be saved. Please try again.", 502);
  }
}
