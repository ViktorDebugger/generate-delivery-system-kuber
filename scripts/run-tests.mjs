import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnv(cwd) {
  const filePath = path.join(cwd, '.env');
  if (!existsSync(filePath)) {
    return {};
  }
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function runNpm(cwd, label, npmArgs) {
  process.stdout.write(`\n${'─'.repeat(60)}\n${label}\n${'─'.repeat(60)}\n`);
  const result = spawnSync('npm', npmArgs, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...loadDotEnv(cwd) },
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    process.exit(code);
  }
}

const prismaApps = ['catalog-service', 'fleet-service', 'order-service'];

for (const app of prismaApps) {
  const cwd = path.join(root, 'apps', app);
  runNpm(cwd, `${app}: unit`, ['test']);
  runNpm(cwd, `${app}: e2e`, ['run', 'test:e2e']);
}

runNpm(path.join(root, 'apps', 'api-gateway'), 'api-gateway: integration', [
  'run',
  'test:integration',
]);

process.stdout.write(`\n${'─'.repeat(60)}\nAll test suites passed.\n`);
