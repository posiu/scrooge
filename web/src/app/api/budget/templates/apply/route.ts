import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { budgetTemplates, budgets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const ApplySchema = z.object({
  templateId: z.string().uuid(),
  month:      z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { templateId, month } = parsed.data;

  const template = await db.query.budgetTemplates.findFirst({
    where: and(eq(budgetTemplates.id, templateId), eq(budgetTemplates.userId, user.id)),
    with: { items: true },
  });
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  if (template.items.length === 0) return NextResponse.json({ error: 'Template has no items' }, { status: 400 });

  // Upsert each budget item for the month
  const results = [];
  for (const item of template.items) {
    const existing = await db.query.budgets.findFirst({
      where: and(eq(budgets.userId, user.id), eq(budgets.month, month), eq(budgets.categoryId, item.categoryId)),
    });
    if (existing) {
      const [updated] = await db.update(budgets).set({ plannedAmount: item.plannedAmount, updatedAt: new Date() })
        .where(eq(budgets.id, existing.id)).returning();
      results.push(updated);
    } else {
      const [created] = await db.insert(budgets).values({
        userId:        user.id,
        categoryId:    item.categoryId,
        month,
        plannedAmount: item.plannedAmount,
      }).returning();
      results.push(created);
    }
  }

  return NextResponse.json({ applied: results.length, month });
}
