import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { investments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const InvestmentSchema = z.object({
  name:         z.string().min(1),
  category:     z.enum(['stocks', 'treasury_bonds', 'corporate_bonds', 'etf', 'deposits', 'mutual_funds', 'currencies', 'precious_metals', 'art', 'cryptocurrencies', 'company_shares', 'derivatives', 'other']),
  currentValue: z.coerce.number().nonnegative(),
  currency:     z.string().default('PLN'),
  institution:  z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.query.investments.findMany({
    where: and(eq(investments.userId, user.id), eq(investments.isActive, true)),
    orderBy: (i, { asc }) => [asc(i.name)],
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = InvestmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const [investment] = await db.insert(investments).values({
    userId:       user.id,
    name:         data.name,
    category:     data.category,
    currentValue: String(data.currentValue),
    currency:     data.currency,
    institution:  data.institution ?? null,
    description:  data.description ?? null,
  }).returning();

  return NextResponse.json(investment, { status: 201 });
}
