import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the API's own .env file only.
config({ path: resolve(__dirname, '../../../.env') });

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
