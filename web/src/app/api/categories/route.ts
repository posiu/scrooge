import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { z } from 'zod';

const CategorySchema = z.object({
  name:      z.string().min(1),
  type:      z.enum(['income', 'expense', 'obligation']),
  parentId:  z.string().uuid().nullable().optional(),
  icon:      z.string().nullable().optional(),
  color:     z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const conditions = [
    or(eq(categories.userId, user.id), isNull(categories.userId)),
    eq(categories.isActive, true),
  ];

  if (type && ['income', 'expense', 'obligation'].includes(type)) {
    conditions.push(eq(categories.type, type as 'income' | 'expense' | 'obligation'));
  }

  const result = await db.query.categories.findMany({
    where: and(...conditions),
    orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [category] = await db.insert(categories).values({
    userId: user.id,
    ...parsed.data,
  }).returning();

  return NextResponse.json(category, { status: 201 });
}
