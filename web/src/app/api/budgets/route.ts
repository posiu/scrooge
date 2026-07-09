import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { budgets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const BudgetSchema = z.object({
  categoryId:    z.string().uuid(),
  month:         z.string().regex(/^\d{4}-\d{2}$/),
  plannedAmount: z.coerce.number().nonnegative(),
  notes:         z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');

  const conditions = [eq(budgets.userId, user.id)];
  if (month) conditions.push(eq(budgets.month, month));

  const result = await db.query.budgets.findMany({
    where: and(...conditions),
    with: { category: true },
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = BudgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Upsert — update if exists
  const existing = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, user.id),
      eq(budgets.categoryId, parsed.data.categoryId),
      eq(budgets.month, parsed.data.month),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(budgets)
      .set({ plannedAmount: String(parsed.data.plannedAmount), notes: parsed.data.notes ?? null, updatedAt: new Date() })
      .where(eq(budgets.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [budget] = await db.insert(budgets).values({
    userId:        user.id,
    categoryId:    parsed.data.categoryId,
    month:         parsed.data.month,
    plannedAmount: String(parsed.data.plannedAmount),
    notes:         parsed.data.notes ?? null,
  }).returning();

  return NextResponse.json(budget, { status: 201 });
}
