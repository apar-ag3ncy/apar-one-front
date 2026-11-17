#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = process.argv[2] && path.resolve(process.argv[2]);
if (!destination || destination === path.parse(destination).root || destination === path.resolve(root) ||
    destination === path.join(root, 'public') || destination.startsWith(path.join(root, 'public') + path.sep)) {
  throw new Error('Provide a new output directory outside public/. Existing directories are never overwritten.');
}
await fs.mkdir(destination); // Deliberately fail if this release path already exists.
const source = await fs.mkdtemp(path.join(os.tmpdir(), 'apar-cpanel-build-'));
try {
  for (const name of ['app', 'components', 'lib', 'public', 'styles', 'next.config.mjs',
    'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.mjs', 'eslint.config.mjs']) {
    await fs.cp(path.join(root, name), path.join(source, name), { recursive: true });
  }
  // Remove the Node-only route only from this isolated build, never the checkout.
  await fs.rm(path.join(source, 'app/api'), { recursive: true });
  await fs.symlink(path.join(root, 'node_modules'), path.join(source, 'node_modules'), 'dir');
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
    cwd: source, stdio: 'inherit', env: { ...process.env, APAR_DEPLOY_TARGET: 'cpanel', NEXT_TELEMETRY_DISABLED: '1' },
  });
  if (build.status !== 0) throw new Error('Static export failed');
  await fs.cp(path.join(source, 'out'), path.join(destination, 'public'), { recursive: true });
  const api = path.join(destination, 'public/api/voice-feedback');
  await fs.mkdir(api, { recursive: true });
  for (const name of ['index.php', 'voice.php', '.user.ini']) {
    await fs.copyFile(path.join(root, 'deploy/cpanel', name), path.join(api, name));
  }
  await fs.copyFile(path.join(root, 'deploy/cpanel/.htaccess'), path.join(destination, 'public/.htaccess'));
  // Disallow direct browsing of the adapter library; the endpoint includes it locally.
  await fs.writeFile(path.join(api, '.htaccess'), '<Files "voice.php">\n  Require all denied\n</Files>\n');
  const manifest = [];
  async function walk(dir) {
    for (const item of (await fs.readdir(dir, { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) await walk(file);
      else {
        const bytes = await fs.readFile(file);
        manifest.push({ path: path.relative(path.join(destination, 'public'), file), bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex') });
      }
    }
  }
  await walk(path.join(destination, 'public'));
  const forbidden = manifest.filter(x => /(^|\/)(?:\.env[^/]*|node_modules|\.git|voice-config\.php)(\/|$)/.test(x.path));
  if (forbidden.length) throw new Error('Private/build files found in public export');
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify({ target: 'cpanel-static-php', files: manifest }, null, 2) + '\n');
  console.log(`cPanel package: ${destination}/public (${manifest.length} files). No server credentials included.`);
} finally {
  await fs.rm(source, { recursive: true, force: true });
}
