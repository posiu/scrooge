import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { enforcementProceedings, enforcementPayments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const PaymentSchema = z.object({
  amount:        z.coerce.number().positive(),
  paymentDate:   z.string(),
  transactionId: z.string().uuid().nullable().optional(),
  description:   z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await db.query.enforcementPayments.findMany({
    where: eq(enforcementPayments.proceedingId, id),
    with: { transaction: true },
    orderBy: (p, { desc }) => [desc(p.paymentDate)],
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const proceeding = await db.query.enforcementProceedings.findFirst({
    where: and(eq(enforcementProceedings.id, id), eq(enforcementProceedings.userId, user.id)),
  });
  if (!proceeding) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;

  const [payment] = await db.insert(enforcementPayments).values({
    proceedingId:  id,
    userId:        user.id,
    amount:        String(data.amount),
    paymentDate:   new Date(data.paymentDate),
    transactionId: data.transactionId ?? null,
    description:   data.description ?? null,
  }).returning();

  // Update remaining amount and status
  const newRemaining = Math.max(0, Number(proceeding.remainingAmount) - data.amount);
  const newStatus = newRemaining === 0 ? 'satisfied'
    : newRemaining < Number(proceeding.originalAmount) ? 'partially_paid'
    : 'active';

  await db.update(enforcementProceedings).set({
    remainingAmount: String(newRemaining),
    status:          newStatus as 'satisfied' | 'partially_paid' | 'active',
    updatedAt:       new Date(),
  }).where(eq(enforcementProceedings.id, id));

  return NextResponse.json(payment, { status: 201 });
}
