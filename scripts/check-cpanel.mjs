#!/usr/bin/env node
// Exercise the exported PHP site with real synthetic audio and private disk storage.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseOptions, runSmoke } from './check-http.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const release = process.argv[2] && path.resolve(process.argv[2]);
if (!release) throw new Error('Usage: node scripts/check-cpanel.mjs RELEASE_DIRECTORY');
await fs.access(path.join(release, 'public/index.html'));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'apar-php-check-'));
const base = 'http://127.0.0.1:3083';
const audio = await fs.readFile(path.join(root, 'tests/fixtures/voice-tone.m4a'));
const integration = [];
try {
  for (const mode of ['On', 'Off']) {
    const storage = path.join(temp, mode);
    const server = spawn('php', ['-d', `enable_post_data_reading=${mode}`, '-d', 'upload_max_filesize=4M', '-d', 'post_max_size=5M',
      '-S', '127.0.0.1:3083', '-t', path.join(release, 'public'), path.join(root, 'scripts/cpanel-router.php')], {
      cwd: root, env: { ...process.env, APAR_VOICE_STORAGE_DIR: storage }, stdio: ['ignore', 'ignore', 'pipe'],
    });
    let serverError;
    let serverOutput = '';
    server.on('error', error => { serverError = error; });
    server.stderr.on('data', chunk => { serverOutput = (serverOutput + chunk).slice(-4000); });
    try {
      let ready = false;
      let readiness = 'no response';
      const startupDeadline = Date.now() + 30_000;
      while (Date.now() < startupDeadline) {
        if (serverError) throw serverError;
        if (server.exitCode !== null) throw new Error(`PHP test server exited before readiness: ${serverOutput}`);
        try {
          const r = await fetch(`${base}/api/voice-feedback`);
          readiness = `HTTP ${r.status}`; await r.body?.cancel(); ready = r.status === 405;
        } catch (error) { readiness = error.message; }
        if (ready) break;
        await delay(100);
      }
      if (!ready) throw new Error(`PHP test server did not become ready (${readiness}): ${serverOutput}`);
      if (mode === 'On') {
        const report = await runSmoke(parseOptions([base, '--require-voice']));
        await fs.writeFile(path.join(release, 'php-http.json'), JSON.stringify(report, null, 2) + '\n');
        console.log(`cPanel HTTP: ${report.summary.pass} passed, ${report.summary.fail} failed, ${report.summary.warn} warnings.`);
        for (const check of report.checks.filter(check => check.outcome !== 'pass').slice(0, 30)) {
          console.error(`${check.outcome.toUpperCase()} ${check.probe || check.assetKind || check.kind} ${check.url || ''}: ${check.issues.join('; ')}`);
        }
        if (report.summary.fail || report.summary.warn) throw new Error('cPanel HTTP checks failed');
      }
      const send = async () => {
        const form = new FormData();
        form.set('name', 'Internal QA'); form.set('brand', 'Synthetic tone - not a client note');
        form.set('duration', '2'); form.set('consent', 'yes'); form.set('website', '');
        form.set('recording', new Blob([audio], {type:'audio/mp4'}), 'tone.m4a');
        return fetch(`${base}/api/voice-feedback`, {method:'POST', headers:{Origin:'https://apar.agency'}, body:form});
      };
      for (let i = 0; i < 3; i++) {
        const response = await send(); const payload = await response.json();
        assert.equal(response.status, 201, JSON.stringify(payload)); assert.equal(payload.ok, true);
        assert.match(payload.id, /^[a-f0-9-]{36}$/);
        const days = (await fs.readdir(storage)).filter(n => /^\d{4}-\d{2}-\d{2}$/.test(n));
        const folder = path.join(storage, days[0], payload.id);
        assert.deepEqual(await fs.readFile(path.join(folder, 'recording.m4a')), audio);
        assert.equal(JSON.parse(await fs.readFile(path.join(folder, 'note.json'), 'utf8')).name, 'Internal QA');
        assert.equal((await fs.stat(folder)).mode & 0o777, 0o700);
        assert.equal((await fs.stat(path.join(folder, 'recording.m4a'))).mode & 0o777, 0o600);
      }
      const limited = await send(); assert.equal(limited.status, 429); await limited.body?.cancel();
      const leaked = await fetch(`${base}/voice-notes`); assert.equal(leaked.status,404); await leaked.body?.cancel();
      integration.push({parser:mode === 'On' ? 'native PHP multipart' : 'raw multipart fallback', uploads:3, byteMatch:true, privatePermissions:true, rateLimit:429});
      console.log(`PHP ${mode}: 3 real audio uploads persisted privately; byte checks, permissions and rate limiting passed.`);
    } finally { const closed = once(server, 'close'); server.kill('SIGTERM'); await closed; }
  }
  await fs.writeFile(path.join(release, 'php-uploads.json'), JSON.stringify(integration,null,2)+'\n');
} finally { await fs.rm(temp, {recursive:true,force:true}); }
