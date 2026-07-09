import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { taxes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const TaxSchema = z.object({
  name:            z.string().min(1),
  type:            z.enum(['personal_income', 'corporate', 'real_estate', 'land', 'pcc', 'investment', 'capital_gains', 'other']),
  taxPeriod:       z.string().nullable().optional(),
  taxOffice:       z.string().nullable().optional(),
  amountDue:       z.coerce.number().positive(),
  amountPaid:      z.coerce.number().nonnegative().default(0),
  dueDate:         z.string().nullable().optional(),
  status:          z.enum(['pending', 'partially_paid', 'paid', 'overdue']).default('pending'),
  linkedAccountId: z.string().uuid().nullable().optional(),
  description:     z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.query.taxes.findMany({
    where: eq(taxes.userId, user.id),
    with: { linkedAccount: true, payments: { orderBy: (p, { desc }) => [desc(p.paymentDate)] } },
    orderBy: (t, { desc }) => [desc(t.dueDate)],
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = TaxSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const [tax] = await db.insert(taxes).values({
    userId:          user.id,
    name:            data.name,
    type:            data.type,
    taxPeriod:       data.taxPeriod ?? null,
    taxOffice:       data.taxOffice ?? null,
    amountDue:       String(data.amountDue),
    amountPaid:      String(data.amountPaid),
    dueDate:         data.dueDate ? new Date(data.dueDate) : null,
    status:          data.status,
    linkedAccountId: data.linkedAccountId ?? null,
    description:     data.description ?? null,
  }).returning();

  return NextResponse.json(tax, { status: 201 });
}
