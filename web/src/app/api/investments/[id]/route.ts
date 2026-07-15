import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { investments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSchema = z.object({
  name:         z.string().min(1).optional(),
  category:     z.enum(['stocks', 'treasury_bonds', 'corporate_bonds', 'etf', 'deposits', 'mutual_funds', 'currencies', 'precious_metals', 'art', 'cryptocurrencies', 'company_shares', 'derivatives', 'other']).optional(),
  currentValue: z.coerce.number().nonnegative().optional(),
  currency:     z.string().optional(),
  institution:  z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
  isActive:     z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await db.query.investments.findFirst({
    where: and(eq(investments.id, id), eq(investments.userId, user.id)),
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
  if (data.name !== undefined)         updateData.name         = data.name;
  if (data.category !== undefined)     updateData.category     = data.category;
  if (data.currentValue !== undefined) updateData.currentValue = String(data.currentValue);
  if (data.currency !== undefined)     updateData.currency     = data.currency;
  if (data.institution !== undefined)  updateData.institution  = data.institution ?? null;
  if (data.description !== undefined)  updateData.description  = data.description ?? null;
  if (data.isActive !== undefined)     updateData.isActive     = data.isActive;

  const [updated] = await db.update(investments)
    .set(updateData)
    .where(and(eq(investments.id, id), eq(investments.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.update(investments)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
