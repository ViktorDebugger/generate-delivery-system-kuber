const { resolve } = require('path');
const { execSync } = require('child_process');

module.exports = async function globalSetup() {
  require('dotenv').config({ path: resolve(__dirname, '../.env.example') });
  require('dotenv').config({
    path: resolve(__dirname, '../.env'),
    override: true,
  });

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'E2E globalSetup: DATABASE_URL is missing. Set it in .env or rely on .env.example.',
    );
  }

  const repoRoot = resolve(__dirname, '..', '..', '..');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
      env: process.env,
    });
  } catch {
    console.error('');
    console.error(
      '[catalog-service e2e] prisma migrate deploy не вдался (часто P1001 — сервер БД недоступний).',
    );
    console.error('  1) З кореня репозиторію:  docker compose up -d postgres');
    console.error(
      '  2) Переконайся, що DATABASE_URL у apps/catalog-service/.env вказує на цю БД (типово localhost:5432, база catalog).',
    );
    console.error(`     Поточний корінь репозиторію для compose: ${repoRoot}`);
    console.error('');
    throw new Error(
      'E2E globalSetup: PostgreSQL недоступний для prisma migrate deploy.',
    );
  }
};
