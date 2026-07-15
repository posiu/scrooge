import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { enforcementProceedings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Statutory interest rates (Polish law, art. 481 KC / Ordynacja podatkowa)
const STATUTORY_RATES = {
  statutory:             11.25, // odsetki ustawowe za opóźnienie (art. 481 KC)
  statutory_commercial:  13.25, // odsetki ustawowe za opóźnienie w transakcjach handlowych
  tax:                   14.50, // odsetki podatkowe (Ordynacja podatkowa)
  tax_delayed:            7.25, // obniżone odsetki podatkowe (50%)
  contractual:            null, // ustalone umownie
  custom:                 null, // ręczne wpisanie
};

const ProceedingSchema = z.object({
  accountId:            z.string().uuid().nullable().optional(),
  creditor:             z.string().min(1),
  enforcementAuthority: z.string().min(1),
  caseNumber:           z.string().nullable().optional(),
  reason:               z.string().min(1),
  originalAmount:       z.coerce.number().positive(),
  remainingAmount:      z.coerce.number().nonnegative(),
  interestType:         z.enum(['statutory', 'statutory_commercial', 'contractual', 'tax', 'tax_delayed', 'custom']).default('statutory'),
  interestRateCustom:   z.coerce.number().nonnegative().nullable().optional(),
  garnishmentDate:      z.string(),
  status:               z.enum(['active', 'partially_paid', 'satisfied', 'appealed', 'suspended']).default('active'),
  description:          z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.query.enforcementProceedings.findMany({
    where: eq(enforcementProceedings.userId, user.id),
    with: {
      account: true,
      payments: { orderBy: (p, { desc }) => [desc(p.paymentDate)] },
    },
    orderBy: (ep, { desc }) => [desc(ep.garnishmentDate)],
  });

  // Attach computed interest to each proceeding
  const now = new Date();
  const withInterest = result.map((p) => {
    const rate = p.interestType === 'custom' || p.interestType === 'contractual'
      ? Number(p.interestRateCustom ?? 0)
      : STATUTORY_RATES[p.interestType] ?? 0;

    const daysDiff = Math.max(0, Math.floor((now.getTime() - new Date(p.garnishmentDate).getTime()) / 86_400_000));
    const interest = (Number(p.remainingAmount) * rate / 100 / 365) * daysDiff;

    return { ...p, computedInterestRate: rate, computedInterest: Math.round(interest * 100) / 100, daysSinceGarnishment: daysDiff };
  });

  return NextResponse.json(withInterest);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = ProceedingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const defaultRate = data.interestType !== 'custom' && data.interestType !== 'contractual'
    ? String(STATUTORY_RATES[data.interestType] ?? 11.25)
    : null;

  const [proceeding] = await db.insert(enforcementProceedings).values({
    userId:               user.id,
    accountId:            data.accountId ?? null,
    creditor:             data.creditor,
    enforcementAuthority: data.enforcementAuthority,
    caseNumber:           data.caseNumber ?? null,
    reason:               data.reason,
    originalAmount:       String(data.originalAmount),
    remainingAmount:      String(data.remainingAmount),
    interestType:         data.interestType,
    interestRate:         defaultRate,
    interestRateCustom:   data.interestRateCustom != null ? String(data.interestRateCustom) : null,
    garnishmentDate:      new Date(data.garnishmentDate),
    status:               data.status,
    description:          data.description ?? null,
  }).returning();

  return NextResponse.json(proceeding, { status: 201 });
}
