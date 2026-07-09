import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { taxes, taxPayments } from '@/lib/db/schema';
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
  const result = await db.query.taxPayments.findMany({
    where: eq(taxPayments.taxId, id),
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
  const tax = await db.query.taxes.findFirst({
    where: and(eq(taxes.id, id), eq(taxes.userId, user.id)),
  });
  if (!tax) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;

  // Insert payment
  const [payment] = await db.insert(taxPayments).values({
    taxId:         id,
    userId:        user.id,
    amount:        String(data.amount),
    paymentDate:   new Date(data.paymentDate),
    transactionId: data.transactionId ?? null,
    description:   data.description ?? null,
  }).returning();

  // Recalculate amountPaid on the tax
  const newAmountPaid = Number(tax.amountPaid) + data.amount;
  const newStatus = newAmountPaid >= Number(tax.amountDue) ? 'paid'
    : newAmountPaid > 0 ? 'partially_paid'
    : 'pending';

  await db.update(taxes).set({
    amountPaid: String(newAmountPaid),
    status:     newStatus as 'paid' | 'partially_paid' | 'pending',
    updatedAt:  new Date(),
  }).where(eq(taxes.id, id));

  return NextResponse.json(payment, { status: 201 });
}
