import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Default: repo root .env — Fallback: api/.env
const rootEnv = resolve(__dirname, '../../../../.env');
const localEnv = resolve(__dirname, '../../../.env');
config({ path: existsSync(rootEnv) ? rootEnv : localEnv });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection
pool
  .query('SELECT 1')
  .then(() => console.log('✓ Database connected'))
  .catch((err) => console.error('✗ Database connection failed:', err.message));

export const db = drizzle(pool, { schema });
export { pool };
