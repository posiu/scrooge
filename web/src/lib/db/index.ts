import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Global singleton to avoid re-creating the client on Next.js hot-reloads in dev.
// NOTE: on Vercel, "global" is scoped per serverless function instance, not
// shared across concurrent requests — under real concurrent load, several
// instances each open their own pool at the same time. Supabase's transaction
// pooler (port 6543, prepare:false) is designed to multiplex many such client
// connections into a small number of real Postgres connections, so each
// instance should hold as few as possible rather than hoarding a chunk of the
// project's pooler connection budget. Verify the actual limit for your plan in
// Supabase Dashboard → Settings → Database → Connection pooling.
const globalForDb = global as typeof globalThis & {
  _pgClient?: ReturnType<typeof postgres>;
};

if (!globalForDb._pgClient) {
  globalForDb._pgClient = postgres(process.env.DATABASE_URL!, {
    prepare:         false, // required for Supabase transaction pooler
    max:             1,     // one connection per function instance — let the pooler fan out
    idle_timeout:    20,
    connect_timeout: 10,
  });
}

export const db = drizzle(globalForDb._pgClient, { schema });

export * from './schema';

