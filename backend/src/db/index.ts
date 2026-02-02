import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';
import { env } from '../config/env.js';

neonConfig.fetchConnectionCache = true;

let sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!sql) {
    sql = neon(env.DATABASE_URL);
  }
  return sql;
}

export async function query<T = Record<string, unknown>>(
  queryText: string,
  params?: unknown[]
): Promise<T[]> {
  const db = getDb();
  const result = await db(queryText, params);
  return result as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  queryText: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(queryText, params);
  return rows[0] ?? null;
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db`SELECT 1`;
    console.log('[Database] Connection successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    return false;
  }
}

export async function initDatabase(): Promise<void> {
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Failed to connect to database');
  }
}
