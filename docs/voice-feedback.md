# Private voice feedback

The control below the testimonial carousel lets visitors record up to 60 seconds, listen back, and send their note privately to APĀR. It is an inbox for the team; recordings are never displayed as testimonials.

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
4. Check that no note or public audio URL appears in the page source or client network response.

Use the dashboard to manage feedback access and retention. Delete an object and its matching metadata row together when a note should be removed.
