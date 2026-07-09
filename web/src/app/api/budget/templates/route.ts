import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { budgetTemplates, budgetTemplateItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const TemplateSchema = z.object({
  name:        z.string().min(1),
  description: z.string().nullable().optional(),
  isDefault:   z.boolean().default(false),
  items: z.array(z.object({
    categoryId:     z.string().uuid(),
    plannedAmount:  z.coerce.number().nonnegative(),
    sortOrder:      z.number().int().default(0),
  })).default([]),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await db.query.budgetTemplates.findMany({
    where: eq(budgetTemplates.userId, user.id),
    with: { items: { with: { category: true }, orderBy: (i, { asc }) => [asc(i.sortOrder)] } },
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = TemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const [template] = await db.insert(budgetTemplates).values({
    userId:      user.id,
    name:        data.name,
    description: data.description ?? null,
    isDefault:   data.isDefault,
  }).returning();

  if (data.items.length > 0) {
    await db.insert(budgetTemplateItems).values(
      data.items.map((item, idx) => ({
        templateId:    template.id,
        categoryId:    item.categoryId,
        plannedAmount: String(item.plannedAmount),
        sortOrder:     item.sortOrder || idx,
      }))
    );
  }

  const full = await db.query.budgetTemplates.findFirst({
    where: eq(budgetTemplates.id, template.id),
    with: { items: { with: { category: true } } },
  });
  return NextResponse.json(full, { status: 201 });
}
