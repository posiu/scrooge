import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { savingsGoals, goalDeposits } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const GoalSchema = z.object({
  name:          z.string().min(1),
  targetAmount:  z.coerce.number().positive(),
  currentAmount: z.coerce.number().nonnegative().default(0),
  targetDate:    z.string().nullable().optional(),
  icon:          z.string().nullable().optional(),
  color:         z.string().nullable().optional(),
  description:   z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const goals = await db.query.savingsGoals.findMany({
    where: eq(savingsGoals.userId, user.id),
    with: { deposits: { orderBy: (d, { desc }) => [desc(d.depositAt)] } },
    orderBy: (g, { asc }) => [asc(g.createdAt)],
  });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = GoalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const [goal] = await db.insert(savingsGoals).values({
    userId:        user.id,
    name:          data.name,
    targetAmount:  String(data.targetAmount),
    currentAmount: String(data.currentAmount),
    targetDate:    data.targetDate ? new Date(data.targetDate) : null,
    icon:          data.icon ?? null,
    color:         data.color ?? '#01581E',
    description:   data.description ?? null,
  }).returning();

  return NextResponse.json(goal, { status: 201 });
}
