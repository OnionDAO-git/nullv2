import { getDb, type Db } from '@nullv2/db';

// Lazy proxy so module-import during `vite build` (SSR chunk rendering)
// doesn't require DATABASE_URL — the real client is constructed on first use.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as Function).bind(real) : value;
  },
});
