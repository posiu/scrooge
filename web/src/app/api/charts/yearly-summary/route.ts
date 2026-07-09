import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const currentYear = new Date().getFullYear();
  const from = Math.max(parseInt(searchParams.get('from') ?? String(currentYear - 2)), currentYear - 10);
  const to   = Math.min(parseInt(searchParams.get('to')   ?? String(currentYear)), currentYear);

  const result = [];
  for (let year = from; year <= to; year++) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59, 999);

    const [incRes, expRes] = await Promise.all([
      db.select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(
          eq(transactions.userId, user.id),
          eq(transactions.type, 'income'),
          gte(transactions.date, yearStart),
          lte(transactions.date, yearEnd),
          isNull(transactions.deletedAt),
        )),
      db.select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(
          eq(transactions.userId, user.id),
          eq(transactions.type, 'expense'),
          gte(transactions.date, yearStart),
          lte(transactions.date, yearEnd),
          isNull(transactions.deletedAt),
        )),
    ]);

    const income  = parseFloat(incRes[0]?.total ?? '0');
    const expense = parseFloat(expRes[0]?.total ?? '0');
    result.push({ year, income, expense, savings: income - expense });
  }

  return NextResponse.json(result);
}
