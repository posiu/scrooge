import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Global singleton to prevent connection pool exhaustion on Next.js hot-reloads.
// Supabase session pooler allows max 15 connections — we keep max=5 per process.
const globalForDb = global as typeof globalThis & {
  _pgClient?: ReturnType<typeof postgres>;
};

if (!globalForDb._pgClient) {
  globalForDb._pgClient = postgres(process.env.DATABASE_URL!, {
    prepare:         false, // required for Supabase transaction pooler
    max:             5,     // safe ceiling under the 15-conn session pooler limit
    idle_timeout:    20,
    connect_timeout: 10,
  });
}

export const db = drizzle(globalForDb._pgClient, { schema });

export * from './schema';

