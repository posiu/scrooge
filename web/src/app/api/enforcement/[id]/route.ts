import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { enforcementProceedings, enforcementPayments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSchema = z.object({
  accountId:            z.string().uuid().nullable().optional(),
  creditor:             z.string().min(1).optional(),
  enforcementAuthority: z.string().min(1).optional(),
  caseNumber:           z.string().nullable().optional(),
  reason:               z.string().min(1).optional(),
  originalAmount:       z.coerce.number().positive().optional(),
  remainingAmount:      z.coerce.number().nonnegative().optional(),
  interestType:         z.enum(['statutory', 'statutory_commercial', 'contractual', 'tax', 'tax_delayed', 'custom']).optional(),
  interestRateCustom:   z.coerce.number().nonnegative().nullable().optional(),
  garnishmentDate:      z.string().optional(),
  status:               z.enum(['active', 'partially_paid', 'satisfied', 'appealed', 'suspended']).optional(),
  description:          z.string().nullable().optional(),
});

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
  const result = await db.query.enforcementProceedings.findFirst({
    where: and(eq(enforcementProceedings.id, id), eq(enforcementProceedings.userId, user.id)),
    with: { account: true, payments: { orderBy: (p, { desc }) => [desc(p.paymentDate)] } },
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
  if (data.accountId !== undefined)            updateData.accountId            = data.accountId ?? null;
  if (data.creditor !== undefined)             updateData.creditor             = data.creditor;
  if (data.enforcementAuthority !== undefined) updateData.enforcementAuthority = data.enforcementAuthority;
  if (data.caseNumber !== undefined)           updateData.caseNumber           = data.caseNumber ?? null;
  if (data.reason !== undefined)               updateData.reason               = data.reason;
  if (data.originalAmount !== undefined)       updateData.originalAmount       = String(data.originalAmount);
  if (data.remainingAmount !== undefined)      updateData.remainingAmount      = String(data.remainingAmount);
  if (data.interestType !== undefined)         updateData.interestType         = data.interestType;
  if (data.interestRateCustom !== undefined)   updateData.interestRateCustom   = data.interestRateCustom != null ? String(data.interestRateCustom) : null;
  if (data.garnishmentDate !== undefined)      updateData.garnishmentDate      = new Date(data.garnishmentDate);
  if (data.status !== undefined)               updateData.status               = data.status;
  if (data.description !== undefined)          updateData.description          = data.description ?? null;

  const [updated] = await db.update(enforcementProceedings)
    .set(updateData)
    .where(and(eq(enforcementProceedings.id, id), eq(enforcementProceedings.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(enforcementProceedings)
    .where(and(eq(enforcementProceedings.id, id), eq(enforcementProceedings.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// POST /api/enforcement/[id]/payments — handled in sub-route
