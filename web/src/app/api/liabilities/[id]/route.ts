import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { liabilities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSchema = z.object({
  name:            z.string().min(1).optional(),
  type:            z.enum(['loan', 'credit', 'subscription', 'installment', 'other']).optional(),
  totalAmount:     z.coerce.number().positive().optional(),
  remainingAmount: z.coerce.number().nonnegative().optional(),
  monthlyPayment:  z.coerce.number().nonnegative().nullable().optional(),
  interestRate:    z.coerce.number().nonnegative().nullable().optional(),
  dueDate:         z.string().nullable().optional(),
  categoryId:      z.string().uuid().nullable().optional(),
  description:     z.string().nullable().optional(),
  isActive:        z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await db.query.liabilities.findFirst({
    where: and(eq(liabilities.id, id), eq(liabilities.userId, user.id)),
    with: { category: true },
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
  if (data.name !== undefined)            updateData.name            = data.name;
  if (data.type !== undefined)            updateData.type            = data.type;
  if (data.totalAmount !== undefined)     updateData.totalAmount     = String(data.totalAmount);
  if (data.remainingAmount !== undefined) updateData.remainingAmount = String(data.remainingAmount);
  if (data.monthlyPayment !== undefined)  updateData.monthlyPayment  = data.monthlyPayment != null ? String(data.monthlyPayment) : null;
  if (data.interestRate !== undefined)    updateData.interestRate    = data.interestRate != null ? String(data.interestRate) : null;
  if (data.dueDate !== undefined)         updateData.dueDate         = data.dueDate ? new Date(data.dueDate) : null;
  if (data.categoryId !== undefined)      updateData.categoryId      = data.categoryId ?? null;
  if (data.description !== undefined)     updateData.description     = data.description ?? null;
  if (data.isActive !== undefined)        updateData.isActive        = data.isActive;

  const [updated] = await db.update(liabilities)
    .set(updateData)
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(liabilities)
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
