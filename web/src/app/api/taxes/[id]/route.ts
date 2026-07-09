import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { taxes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSchema = z.object({
  name:            z.string().min(1).optional(),
  type:            z.enum(['personal_income', 'corporate', 'real_estate', 'land', 'pcc', 'investment', 'capital_gains', 'other']).optional(),
  taxPeriod:       z.string().nullable().optional(),
  taxOffice:       z.string().nullable().optional(),
  amountDue:       z.coerce.number().positive().optional(),
  amountPaid:      z.coerce.number().nonnegative().optional(),
  dueDate:         z.string().nullable().optional(),
  status:          z.enum(['pending', 'partially_paid', 'paid', 'overdue']).optional(),
  linkedAccountId: z.string().uuid().nullable().optional(),
  description:     z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await db.query.taxes.findFirst({
    where: and(eq(taxes.id, id), eq(taxes.userId, user.id)),
    with: { linkedAccount: true, payments: { orderBy: (p, { desc }) => [desc(p.paymentDate)] } },
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
  if (data.taxPeriod !== undefined)       updateData.taxPeriod       = data.taxPeriod;
  if (data.taxOffice !== undefined)       updateData.taxOffice       = data.taxOffice;
  if (data.amountDue !== undefined)       updateData.amountDue       = String(data.amountDue);
  if (data.amountPaid !== undefined)      updateData.amountPaid      = String(data.amountPaid);
  if (data.dueDate !== undefined)         updateData.dueDate         = data.dueDate ? new Date(data.dueDate) : null;
  if (data.status !== undefined)          updateData.status          = data.status;
  if (data.linkedAccountId !== undefined) updateData.linkedAccountId = data.linkedAccountId ?? null;
  if (data.description !== undefined)     updateData.description     = data.description ?? null;

  const [updated] = await db.update(taxes)
    .set(updateData)
    .where(and(eq(taxes.id, id), eq(taxes.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(taxes)
    .where(and(eq(taxes.id, id), eq(taxes.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
