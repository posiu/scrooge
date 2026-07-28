import { db } from '@/lib/db';
import { rateLimitHits } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

// DB-backed rate limiter — no external service required. Fine for the low
// volume of public, unauthenticated endpoints (waitlist, feature requests);
// revisit with something like Upstash if traffic grows significantly.
export async function checkRateLimit(key: string, maxHits: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  return db.transaction(async (tx) => {
    // Serialize concurrent calls for the same key so the count-then-insert
    // below can't race under parallel requests — an advisory lock keyed by
    // the rate-limit key, held only for this transaction and released
    // automatically on commit/rollback.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(rateLimitHits)
      .where(and(eq(rateLimitHits.key, key), gte(rateLimitHits.createdAt, windowStart)));

    if (Number(count) >= maxHits) return false;

    await tx.insert(rateLimitHits).values({ key });
    return true;
  });
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
