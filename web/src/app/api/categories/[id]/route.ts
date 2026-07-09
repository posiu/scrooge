import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSchema = z.object({
  name:     z.string().min(1).optional(),
  type:     z.enum(['income', 'expense', 'obligation']).optional(),
  icon:     z.string().nullable().optional(),
  color:    z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

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
  if (data.name !== undefined)     updateData.name     = data.name;
  if (data.type !== undefined)     updateData.type     = data.type;
  if (data.icon !== undefined)     updateData.icon     = data.icon ?? null;
  if (data.color !== undefined)    updateData.color    = data.color ?? null;
  if (data.parentId !== undefined) updateData.parentId = data.parentId ?? null;

  // Allow editing own categories or system ones
  const cat = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (cat.userId && cat.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [updated] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cat = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (cat.isSystem) return NextResponse.json({ error: 'Cannot delete system category' }, { status: 400 });
  if (cat.userId && cat.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Soft-delete
  await db.update(categories).set({ isActive: false, updatedAt: new Date() }).where(eq(categories.id, id));
  return NextResponse.json({ success: true });
}
