import pg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// The Neon driver speaks HTTP/WebSocket to *.neon.tech. A local Postgres URL
// uses node-postgres over the normal wire protocol. Both expose the same Pool.
neonConfig.webSocketConstructor = ws;

let pool;

export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const error = new Error('DATABASE_URL is not set');
    error.statusCode = 503;
    throw error;
  }
  return url;
}

export function isNeonUrl(url) {
  try {
    return new URL(url).hostname.endsWith('.neon.tech');
  } catch {
    return false;
  }
}

export function getPool() {
  if (!pool) {
    const url = databaseUrl();
    pool = isNeonUrl(url)
      ? new NeonPool({ connectionString: url, max: 1 })
      : new pg.Pool({ connectionString: url, max: 5 });
  }
  return pool;
}

export async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result.rows;
}

export async function withTransaction(run) {
  const client = await getPool().connect();
  const q = async (text, params = []) => (await client.query(text, params)).rows;
  try {
    await client.query('BEGIN');
    const result = await run(q);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The original error is the one to surface.
    }
    throw error;
  } finally {
    client.release();
  }
}
