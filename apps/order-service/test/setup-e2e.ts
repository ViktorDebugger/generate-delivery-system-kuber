import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.example'), quiet: true });
config({ path: resolve(__dirname, '../.env'), override: true, quiet: true });

process.env.CATALOG_SERVICE_URL = 'http://127.0.0.1:14001';
process.env.FLEET_SERVICE_URL = 'http://127.0.0.1:14002';
const jwtRaw = process.env['JWT_SECRET']?.trim();
process.env['JWT_SECRET'] =
  jwtRaw !== undefined && jwtRaw !== ''
    ? jwtRaw
    : 'e2e-jwt-secret-min-32-characters!!';
const expRaw = process.env['JWT_EXPIRES_IN']?.trim();
process.env['JWT_EXPIRES_IN'] =
  expRaw !== undefined && expRaw !== '' ? expRaw : '1h';
