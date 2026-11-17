# Voice feedback and approved testimonials

The control below the testimonial carousel lets visitors record up to 60 seconds, listen back, and send their note privately to APĀR. Submissions enter the team's private inbox. They are never published automatically.

## Public playback

The separate **In their own words** section uses a manually curated list in `lib/client-voices.ts`. Only recordings with separate, explicit client permission belong in this list. Approved copies live under `public/audio/testimonials/`; the Supabase originals and all other submissions remain private. Never make the inbox bucket public or expose its service key to add a testimonial.

Each entry contains a display name, brand, local audio path, duration and waveform peaks measured from that recording. The player requests audio only after a visitor taps play, allows seeking and retries, and pauses the previous note when another starts. It uses native audio without an audio-processing library or autoplay. Cards stack on phones.

To add an approved recording, download that specific object from the private bucket, export a browser-compatible copy, measure its duration and waveform, and add the public copy and metadata together. To remove public playback, remove the entry and its shipped copy; this does not delete the private original. Previously downloaded copies cannot be recalled.

The two featured recordings were approved for public playback by the site owner on 24 October 2026:

| Public label | Supabase source row | Public copy |
| --- | --- | --- |
| Viral · Hari Om Infotech | `8a2281a6-df37-4a60-ba46-3869b4220da5` | `hari-om-infotech.m4a` |
| Hiccup | `b19291a3-9a17-4981-9dfc-02642e99c4f1` | `hiccup.m4a` |

These are AAC mono exports at 64 kbps with the full recordings preserved (about 27 and 36 seconds). The synthetic backend verification entry is excluded. Waveforms contain 48 normalized RMS measurements; no client-side decoding or animation loop is needed. The public copies total about 514 KiB and are not requested during page load.

## GoDaddy PHP storage (current production)

PHP stores submissions in `/home/fm44mg4nvhpo/apar-private/voice-notes`, outside the web root. In cPanel File Manager open that path, then the date and submission ID. `note.json` contains the sender, brand, timestamp and consent; download the adjacent audio file to listen. Direct public access is not provided. Directories use 0700 and files use 0600. The existing Supabase credentials are unused by this deployment.

The upload endpoint accepts native PHP multipart uploads and falls back to bounded raw parsing if the server disables automatic parsing. It validates fields, consent, MIME and signatures, imposes a 4 MiB file cap, and saves each note atomically before confirming success. Limits are three attempts per visitor per hour, 200 site-wide per day, and 512 MiB of private storage. Browser recording is capped at 60 seconds; duration in metadata is client-reported. No note is published automatically.

`APAR_VOICE_STORAGE_DIR` is a server-only override for tests; production uses the fixed private account path. The synthetic two-second tone in `tests/fixtures/voice-tone.m4a` is test audio, not a client recording.

## Supabase storage (optional Node deployment)

- `supabase/migrations/20261015_client_voice_feedback.sql` creates the private `client-voice-feedback` Storage bucket, metadata table, and submission rate-limit function.
- Files live in Storage under `client-voice-feedback/YYYY-MM-DD/<uuid>.<extension>`. The `client_voice_feedback.storage_path` field links each metadata row to its file.
- To review notes, use the Supabase dashboard's Table Editor for `client_voice_feedback` and the Storage view for the corresponding object. The bucket is private; there are no anonymous read policies.
- Only the Next.js server route holds the `sb_secret_` key. Do not put it in a `NEXT_PUBLIC_` variable, browser code, or Git.

## Configuration

Use the dedicated `apar-one-front` Supabase project `msqfxdqeilrzmsddlxwl`. Set `APAR_VOICE_SUPABASE_URL` and `APAR_VOICE_SUPABASE_SECRET_KEY` in `.env.local` for local use and in the server environment for the deployed site. The route rejects any other project URL, including the unrelated `Apar One` project. Apply the SQL migration once to the new project. The route returns 503 when configuration is missing or mismatched.

### Public origins and self-hosting

The origin allowlist includes `https://apar.agency`, `https://www.apar.agency`, and the existing `https://apar-one-front.vercel.app` deployment. For additional public domains or specific preview deployments, set the **server-only** `APAR_VOICE_ALLOWED_ORIGINS` variable to a comma-separated list of complete origins, for example `https://preview.example,https://studio.example`. These entries extend the built-in list. Paths, credentials, query strings, wildcards and non-loopback HTTP origins are rejected; invalid configuration returns 503. Do not use a `NEXT_PUBLIC_` variable for this setting.

In `NODE_ENV=development`, HTTP/HTTPS origins on `localhost`, `127.0.0.1`, and `[::1]` are also allowed on any port. A local production preview must explicitly add its loopback origin, such as `http://localhost:3021`. Production microphone access requires HTTPS; localhost is the browser's development exception.

The route does not derive trusted origins from `request.nextUrl`, `Host`, or forwarded host headers. This supports a reverse proxy forwarding a public HTTPS site to an internal Node address. Requests without an Origin header retain the existing non-browser API contract; `Origin: null` and other untrusted origins return 403. The endpoint has no cookie authentication, so this check is not a substitute for abuse controls.

The three-attempts-per-hour limit still hashes the first `x-forwarded-for` address. Self-hosted ingress must overwrite this header with the actual visitor address and prevent direct access that bypasses the proxy. Missing addresses share the `unknown` limit. Configure this at the trusted ingress rather than passing through caller-supplied values.

### Request limits and delivery outcomes

The multipart body is read through an actual byte counter before parsing, capped at **4 MiB plus 64,000 bytes** of multipart overhead. An absent or understated Content-Length does not bypass that limit. The recording itself remains limited to 4 MiB. Only `name`, `brand`, `duration`, `consent`, `website`, and `recording` are accepted; duplicate fields and file-valued text fields return 400. Existing name, consent, duration, MIME and signature validation remains in place. A filled honeypot returns 202 without any provider calls; the client submits the input's actual DOM value, including autofill.

Body intake has an **8-second** deadline. Provider work shares a separate **20-second** budget: rate reservation up to 3 seconds, audio upload up to 6 seconds, metadata insert/retry up to 4 seconds each, and lookup/deletion up to 2 seconds each, always capped by the remaining total budget. The deadlines cover response-body reads too. Body timeout returns 408; rate-service failures return 503; delivery failures or uncertainty return 502. The browser retains its 30-second wait and reviewable recording after errors. Successful delivery still returns `201 { ok: true, id }`; error responses retain `{ error }`.

After a confirmed upload, metadata processing deliberately continues within its bounded deadline even if the browser disconnects. A failed or timed-out insert is checked by its generated ID and expected storage path. If the row exists, delivery is successful. Otherwise an ambiguous insert gets one idempotent retry with the **same ID, payload and object**, using PostgREST `on_conflict=id` and `Prefer: resolution=ignore-duplicates,return=minimal`, followed by another lookup. This cannot overwrite an existing row. See the [PostgREST upsert contract](https://docs.postgrest.org/en/stable/references/api/tables_views.html#upsert).

An empty lookup after a timeout does **not** prove the original insert failed: an in-flight transaction may still commit. Automatic audio deletion is allowed only after an explicit database rejection known to prevent commit (not-null, foreign-key, check, input-format/length or permission errors) **and** a successful lookup confirming no metadata row. Cleanup gets at most two bounded attempts. Duplicate conflicts, network failures, 5xx responses, malformed/failed lookups and unresolved timeouts never authorize deletion. This follows PostgreSQL's [read-committed visibility rules](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED).

If reconciliation or deletion cannot finish, the route retains the private object and logs `voice_feedback_reconciliation_needed` with only an opaque submission `id` and `stage` (`upload`, `metadata`, `metadata_lookup`, or `cleanup`). It never logs names, IPs, recordings, keys or provider response bodies. Ambiguous metadata saves return a message asking the visitor to check with the team before resending. An upload can also finish remotely after its request times out, so an upload-stage warning needs review even if no metadata insert was attempted.

These warnings need operator follow-up; there is no durable background cleanup worker in this application. Using authorized dashboard access, wait for provider requests to settle, find the row by its opaque ID and the object by the same UUID filename, and preserve any object referenced by a committed row. Remove only confirmed unreferenced objects. Do not automatically delete audio based on a single empty read during an outage. No schema migration is required for this handler change.

## Verification

Offline checks (synthetic inputs and intercepted provider calls only):

```sh
node --test tests/voice-feedback-api.test.mjs tests/voice-feedback.test.mjs
```

These exercise the real route with Web Request/FormData parsing and controlled clocks: public/proxy/development origins, malformed configuration, streamed size enforcement, duplicate/unknown fields, honeypot handling, rate denial, operation and response-body deadlines, metadata acknowledgements lost before/after commit, idempotent retry, conservative cleanup, failed cleanup diagnostics, and client disconnects. Client checks cover the actual honeypot value and the delivery-uncertainty message. No network provider, microphone, private recording or database is used.

The following live checks require separate authorization for browser/provider access and create a private submission:

1. Open the home page and scroll to Testimonials; confirm the small dark voice-note control is below the carousel, including at 390px width.
2. Record a short note, stop it, play it back, enter a name, agree to send, and confirm the private success message.
3. In Supabase, confirm one new metadata row and a matching object in the private bucket.
4. Confirm that the new private note does not appear in public players or their source. Only the explicit curated list may be public.
5. For each approved player, check play/pause, seek, replay after the end, keyboard controls, retry after a failed request and switching between notes. Audio must not download before play. Check the cards at phone and desktop widths.

Use the dashboard to manage feedback access and retention. Delete an object and its matching metadata row together when a note should be removed.
