import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, env } from 'prisma/config';

const appRoot = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(appRoot, '.env.example') });
config({ path: resolve(appRoot, '.env'), override: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
