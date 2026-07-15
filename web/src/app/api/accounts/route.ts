import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const AccountSchema = z.object({
  name:        z.string().min(1),
  type:        z.enum(['bank', 'cash', 'crypto', 'fund', 'insurance', 'other']),
  currency:    z.string().default('PLN'),
  institution: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder:   z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.query.accounts.findMany({
    where: and(eq(accounts.userId, user.id), eq(accounts.isActive, true)),
    orderBy: (a, { asc }) => [asc(a.sortOrder), asc(a.name)],
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = AccountSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [account] = await db.insert(accounts).values({
    userId: user.id,
    ...parsed.data,
  }).returning();

  return NextResponse.json(account, { status: 201 });
}
