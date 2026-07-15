import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { savingsGoals, goalDeposits } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const DepositSchema = z.object({
  amount:    z.coerce.number().positive(),
  note:      z.string().nullable().optional(),
  depositAt: z.string().optional(),
});

const UpdateSchema = z.object({
  name:          z.string().min(1).optional(),
  targetAmount:  z.coerce.number().positive().optional(),
  currentAmount: z.coerce.number().nonnegative().optional(),
  targetDate:    z.string().nullable().optional(),
  icon:          z.string().nullable().optional(),
  color:         z.string().nullable().optional(),
  status:        z.enum(['active', 'completed', 'cancelled']).optional(),
  description:   z.string().nullable().optional(),
});

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
  if (data.name !== undefined)          updateData.name          = data.name;
  if (data.targetAmount !== undefined)  updateData.targetAmount  = String(data.targetAmount);
  if (data.currentAmount !== undefined) updateData.currentAmount = String(data.currentAmount);
  if (data.targetDate !== undefined)    updateData.targetDate    = data.targetDate ? new Date(data.targetDate) : null;
  if (data.icon !== undefined)          updateData.icon          = data.icon ?? null;
  if (data.color !== undefined)         updateData.color         = data.color ?? null;
  if (data.status !== undefined)        updateData.status        = data.status;
  if (data.description !== undefined)   updateData.description   = data.description ?? null;

  const [updated] = await db.update(savingsGoals)
    .set(updateData)
    .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const goal = await db.query.savingsGoals.findFirst({
    where: and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)),
  });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = DepositSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const [deposit] = await db.insert(goalDeposits).values({
    goalId:    id,
    userId:    user.id,
    amount:    String(data.amount),
    note:      data.note ?? null,
    depositAt: data.depositAt ? new Date(data.depositAt) : new Date(),
  }).returning();

  const newAmount = Math.min(Number(goal.targetAmount), Number(goal.currentAmount) + data.amount);
  const newStatus = newAmount >= Number(goal.targetAmount) ? 'completed' : 'active';

  await db.update(savingsGoals).set({
    currentAmount: String(newAmount),
    status:        newStatus as 'completed' | 'active',
    updatedAt:     new Date(),
  }).where(eq(savingsGoals.id, id));

  return NextResponse.json(deposit, { status: 201 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const goal = await db.query.savingsGoals.findFirst({
    where: and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)),
  });
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
  return NextResponse.json({ success: true });
}
