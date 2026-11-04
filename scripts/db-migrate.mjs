import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL in .env');
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '../db/migrations');
const files = readdirSync(dir).filter((name) => name.endsWith('.sql')).sort();
const client = new pg.Client({ connectionString: url });

await client.connect();
try {
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    await client.query(sql);
    console.log(`applied ${file}`);
  }
} finally {
  await client.end();
}
