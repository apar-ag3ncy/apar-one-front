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

## Storage and access

- `supabase/migrations/20261015_client_voice_feedback.sql` creates the private `client-voice-feedback` Storage bucket, metadata table, and submission rate-limit function.
- Files live in Storage under `client-voice-feedback/YYYY-MM-DD/<uuid>.<extension>`. The `client_voice_feedback.storage_path` field links each metadata row to its file.
- To review notes, use the Supabase dashboard's Table Editor for `client_voice_feedback` and the Storage view for the corresponding object. The bucket is private; there are no anonymous read policies.
- Only the Next.js server route holds the `sb_secret_` key. Do not put it in a `NEXT_PUBLIC_` variable, browser code, or Git.

## Configuration

Use the dedicated `apar-one-front` Supabase project `msqfxdqeilrzmsddlxwl`. Set `APAR_VOICE_SUPABASE_URL` and `APAR_VOICE_SUPABASE_SECRET_KEY` in `.env.local` for local use and in the server environment for the deployed site. The route rejects any other project URL, including the unrelated `Apar One` project. Apply the SQL migration once to the new project. The route returns 503 when configuration is missing or mismatched.

The route validates origin, consent, name, duration, size, format signature, and a three-attempts-per-hour limit keyed by a one-way hash of the visitor IP. Failed metadata saves remove the uploaded object. Successful notes return an opaque ID only. The UI requires HTTPS or localhost for microphone access.

## Verification

1. Open the home page and scroll to Testimonials; confirm the small dark voice-note control is below the carousel, including at 390px width.
2. Record a short note, stop it, play it back, enter a name, agree to send, and confirm the private success message.
3. In Supabase, confirm one new metadata row and a matching object in the private bucket.
4. Confirm that the new private note does not appear in public players or their source. Only the explicit curated list may be public.
5. For each approved player, check play/pause, seek, replay after the end, keyboard controls, retry after a failed request and switching between notes. Audio must not download before play. Check the cards at phone and desktop widths.

Use the dashboard to manage feedback access and retention. Delete an object and its matching metadata row together when a note should be removed.
