import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.example'), quiet: true });
config({ path: resolve(__dirname, '../.env'), override: true, quiet: true });

if (process.env.CATALOG_E2E_REDIS !== '1') {
  process.env.REDIS_DISABLED = 'true';
} else if (process.env.REDIS_HOST === 'redis') {
  process.env.REDIS_HOST = '127.0.0.1';
}
