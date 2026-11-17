# APAR production deployment

Target: `https://apar.agency`. Runtime: Node.js 22, Next.js 15, React 19,
TypeScript and Tailwind CSS. Use the Node.js app included with the existing
GoDaddy hosting plan so `/api/voice-feedback` remains server-side.

## Protected service

Never move, overwrite or delete `public_html/calendar.apar.agency`, its database,
its DNS records, or any `calendar-*` release/backup directory. Preserve
`.well-known`, `cgi-bin`, mail, SSL and other account-level files. Never use a
recursive sync or delete against the entire `public_html` directory.

## Release checks

1. Verify the checkout and upstream commit. Run `npm ci` on Node.js 22.
2. Run `npm run check` and `npm audit --omit=dev`.
3. Build in an isolated source directory: `npm run check:production`. A dev
   server and production build must not share `.next`.
4. Start the built app, then run `node scripts/check-http.mjs URL --report PATH`.
   This checks HTTP routes, assets and rejection paths, not browser interaction.
5. Test the hosted preview on desktop and phone: navigation, all case pages,
   menus, animations, image hover, audio controls and the brief form.
6. Configure and verify the real backend before declaring voice feedback live.
   Add `--require-voice` to HTTP checks once its environment is configured.
7. Commit the tested source and wait for the GitHub `Verify production build`
   workflow to pass. Compare the published source to the tested commit.

CI also audits production dependencies and starts the built server for HTTP
route/asset checks. Its missing voice credentials are explicitly reported as a
warning; the hosted release must pass `--require-voice` with real configuration.

Next and Sharp are pinned to patched versions. The PostCSS 8.5.33 override
replaces a vulnerable transitive version while retaining Next 15. Build-time
TypeScript, Tailwind and lint packages are included in `dependencies` because
GoDaddy's documented installer omits development dependencies. Playwright and
the offline logo tracing tool remain development-only.

## Package and hosting

The upload ZIP must have `package.json` and `package-lock.json` at its root,
plus `app/`, `components/`, `lib/`, `public/`, `styles/` and config files.
Exclude `.env*`, `.git`, `node_modules`, `.next`, local reports and raw design
sources. Verify ZIP integrity and record its SHA-256 and source-file manifest.
GoDaddy installs Linux dependencies, builds, and starts with `npm start`; Next
uses the platform's `PORT`. Do not upload macOS native dependencies.

Server environment variables:

- `APAR_VOICE_SUPABASE_URL`: approved APAR voice project URL.
- `APAR_VOICE_SUPABASE_SECRET_KEY`: server-only secret; never `NEXT_PUBLIC_*`.
- `APAR_VOICE_ALLOWED_ORIGINS`: exact hosted preview origins, if needed.
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: optional voice concierge configuration.
- `NEXT_PUBLIC_BRIEF_ENDPOINT`: optional brief endpoint; otherwise email handoff.
- `NEXT_PUBLIC_ADOBE_FONTS_KIT`: optional; local fonts remain available.

Store secrets only in the hosting environment, not Git or the upload archive.
GoDaddy's setup currently requires accepting Universal Terms and AI Terms;
the account owner must confirm that legal step.

## Archive and cutover

The initial old-site backup is outside the public root at:
`/home/fm44mg4nvhpo/archived-old-apar-project-20261117/`.

Its explicit inventory is `__MACOSX/`, `_next/`, `.htaccess`, `404.html`,
`404.shtml`, `favicon.ico`, `home.html`, `index.html`, `index.txt`, and
`layout-styles.css`. Calendar is excluded. Verify the backup before cutover.
Keep originals serving until the hosted preview and release checks pass.

Connect only `apar.agency` and, if required, `www.apar.agency` to the approved
APAR app. Inspect DNS changes before applying them; preserve Calendar's
explicit record and all unrelated records. Recheck HTTPS, direct case URLs,
assets and backend behavior on the production domain after publication.

## Rollback

If the homepage, case pages, assets or required backend fail, restore the
previous main-domain routing and old-site files from the archive. Restore only
the explicit old-site inventory above. Never roll back the hosting account or
the Calendar directory. Retain the failed release, build logs and manifest
for diagnosis. A successful build alone is not evidence of a successful launch.
