import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.example'), quiet: true });
config({ path: resolve(__dirname, '../.env'), override: true, quiet: true });
