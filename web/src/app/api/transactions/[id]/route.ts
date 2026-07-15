import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSchema = z.object({
  accountId:           z.string().uuid().optional(),
  categoryId:          z.string().uuid().nullable().optional(),
  amount:              z.coerce.number().positive().optional(),
  type:                z.enum(['income', 'expense', 'transfer']).optional(),
  currency:            z.string().optional(),
  description:         z.string().nullable().optional(),
  date:                z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  tags:                z.array(z.string()).nullable().optional(),
  transferToAccountId: z.string().uuid().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, user.id)),
    with: { category: true, account: true },
  });

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.accountId !== undefined)           updateData.accountId           = data.accountId;
  if (data.categoryId !== undefined)          updateData.categoryId          = data.categoryId ?? null;
  if (data.amount !== undefined)              updateData.amount              = String(data.amount);
  if (data.type !== undefined)                updateData.type                = data.type;
  if (data.currency !== undefined)            updateData.currency            = data.currency;
  if (data.description !== undefined)         updateData.description         = data.description ?? null;
  if (data.date !== undefined)                updateData.date                = new Date(data.date);
  if (data.tags !== undefined)                updateData.tags                = data.tags ?? null;
  if (data.transferToAccountId !== undefined) updateData.transferToAccountId = data.transferToAccountId ?? null;

  const [updated] = await db.update(transactions)
    .set(updateData)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.update(transactions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
