#!/usr/bin/env node
// Verify the static launch and intentionally disabled recording endpoint.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseOptions, runSmoke } from './check-http.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const release = process.argv[2] && path.resolve(process.argv[2]);
if (!release) throw new Error('Usage: node scripts/check-cpanel.mjs RELEASE_DIRECTORY');
await fs.access(path.join(release, 'public/index.html'));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'apar-php-check-'));
const base = 'http://127.0.0.1:3083';
const server = spawn('php', ['-d', 'enable_post_data_reading=Off', '-S', '127.0.0.1:3083',
  '-t', path.join(release, 'public'), path.join(root, 'scripts/cpanel-router.php')], {
  cwd: root, env: { ...process.env }, stdio: ['ignore', 'ignore', 'pipe'],
});
let serverError;
server.on('error', error => { serverError = error; });
server.stderr.on('data', () => {});
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error('PHP test server exited before readiness');
    try { const response = await fetch(`${base}/api/voice-feedback`); await response.body?.cancel(); ready = response.status === 410; } catch {}
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error('PHP test server did not become ready');
  const report = await runSmoke(parseOptions([base, '--voice-disabled']));
  await fs.writeFile(path.join(release, 'php-http.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`cPanel HTTP: ${report.summary.pass} passed, ${report.summary.fail} failed, ${report.summary.warn} warnings.`);
  if (report.summary.fail || report.summary.warn) throw new Error('cPanel HTTP checks failed; see php-http.json');
} finally {
  server.kill('SIGTERM');
  await fs.rm(temp, { recursive: true, force: true });
}
