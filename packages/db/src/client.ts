import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.ts';
import * as external from './external/index.ts';

const allSchema = { ...schema, ...external };

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  const queryClient = postgres(url, { max: 10 });
  return drizzle(queryClient, { schema: allSchema });
}

let _db: Db | null = null;

/** Process-wide singleton. Reads DATABASE_URL once. */
export function getDb(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  _db = createDb(url);
  return _db;
}
