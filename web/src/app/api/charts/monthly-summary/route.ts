import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get('months') ?? '6');

  const now = new Date();
  const result: { month: string; przychody: number; wydatki: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const [incRes, expRes] = await Promise.all([
      db.select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(
          eq(transactions.userId, user.id),
          eq(transactions.type, 'income'),
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd),
          isNull(transactions.deletedAt),
        )),
      db.select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(and(
          eq(transactions.userId, user.id),
          eq(transactions.type, 'expense'),
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd),
          isNull(transactions.deletedAt),
        )),
    ]);

    result.push({
      month:     format(d, 'MMM', { locale: pl }),
      przychody: parseFloat(incRes[0]?.total ?? '0'),
      wydatki:   parseFloat(expRes[0]?.total ?? '0'),
    });
  }

  return NextResponse.json(result);
}
