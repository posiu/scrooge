import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions, categories } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, sum } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  const [y, m] = month.split('-').map(Number);

  const monthStart = new Date(y, m - 1, 1);
  const monthEnd   = new Date(y, m, 0, 23, 59, 59, 999);

  const result = await db
    .select({
      categoryId:   transactions.categoryId,
      categoryName: categories.name,
      total:        sum(transactions.amount),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, 'expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd),
        isNull(transactions.deletedAt),
      ),
    )
    .groupBy(transactions.categoryId, categories.name)
    .orderBy(sum(transactions.amount));

  const data = result.map((r) => ({
    name:  r.categoryName ?? 'Bez kategorii',
    value: parseFloat(r.total ?? '0'),
  })).filter((r) => r.value > 0);

  return NextResponse.json(data);
}
