import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and, isNull, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const TransactionSchema = z.object({
  accountId:           z.string().uuid(),
  categoryId:          z.string().uuid().nullable().optional(),
  amount:              z.coerce.number().positive(),
  type:                z.enum(['income', 'expense', 'transfer']),
  currency:            z.string().default('PLN'),
  description:         z.string().nullable().optional(),
  date:                z.string().datetime({ offset: true }).or(z.string().date()),
  tags:                z.array(z.string()).optional(),
  transferToAccountId: z.string().uuid().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const type  = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') ?? '100');

  const conditions = [
    eq(transactions.userId, user.id),
    isNull(transactions.deletedAt),
  ];

  if (month) {
    const [y, m] = month.split('-').map(Number);
    conditions.push(gte(transactions.date, new Date(y, m - 1, 1)));
    conditions.push(lte(transactions.date, new Date(y, m, 0, 23, 59, 59)));
  }

  if (type && ['income', 'expense', 'transfer'].includes(type)) {
    conditions.push(eq(transactions.type, type as 'income' | 'expense' | 'transfer'));
  }

  const result = await db.query.transactions.findMany({
    where: and(...conditions),
    with: { category: true, account: true },
    orderBy: desc(transactions.date),
    limit,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = TransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data } = parsed;
  const date = new Date(data.date);

  const [tx] = await db.insert(transactions).values({
    userId:              user.id,
    accountId:           data.accountId,
    categoryId:          data.categoryId ?? null,
    amount:              String(data.amount),
    type:                data.type,
    currency:            data.currency,
    description:         data.description ?? null,
    date,
    tags:                data.tags ?? null,
    transferToAccountId: data.transferToAccountId ?? null,
  }).returning();

  return NextResponse.json(tx, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db
    .update(transactions)
    .set({ deletedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

  return NextResponse.json({ ok: true });
}
