import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { liabilities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const LiabilitySchema = z.object({
  name:            z.string().min(1),
  type:            z.enum(['loan', 'credit', 'subscription', 'installment', 'other']),
  totalAmount:     z.coerce.number().positive(),
  remainingAmount: z.coerce.number().nonnegative(),
  monthlyPayment:  z.coerce.number().nonnegative().nullable().optional(),
  interestRate:    z.coerce.number().nonnegative().nullable().optional(),
  dueDate:         z.string().datetime({ offset: true }).nullable().optional().or(z.string().date().nullable().optional()),
  categoryId:      z.string().uuid().nullable().optional(),
  description:     z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.query.liabilities.findMany({
    where: and(eq(liabilities.userId, user.id), eq(liabilities.isActive, true)),
    with: { category: true },
    orderBy: (l, { asc }) => [asc(l.dueDate)],
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = LiabilitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const [liability] = await db.insert(liabilities).values({
    userId:          user.id,
    name:            data.name,
    type:            data.type,
    totalAmount:     String(data.totalAmount),
    remainingAmount: String(data.remainingAmount),
    monthlyPayment:  data.monthlyPayment != null ? String(data.monthlyPayment) : null,
    interestRate:    data.interestRate != null ? String(data.interestRate) : null,
    dueDate:         data.dueDate ? new Date(data.dueDate) : null,
    categoryId:      data.categoryId ?? null,
    description:     data.description ?? null,
  }).returning();

  return NextResponse.json(liability, { status: 201 });
}
