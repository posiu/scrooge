import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName:  z.string().nullable().optional(),
  currency:  z.string().optional(),
  plan:      z.enum(['free', 'basic', 'pro']).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined)  updateData.lastName  = data.lastName ?? null;
  if (data.currency !== undefined)  updateData.currency  = data.currency;
  if (data.plan !== undefined)      updateData.plan      = data.plan;

  const [updated] = await db.insert(userSettings)
    .values({
      userId:    id,
      firstName: data.firstName ?? '',
      lastName:  data.lastName ?? null,
      currency:  data.currency ?? 'PLN',
      plan:      data.plan ?? 'free',
    })
    .onConflictDoUpdate({ target: userSettings.userId, set: updateData })
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: 'Nie możesz usunąć własnego konta' }, { status: 400 });
  }

  const supabaseAdmin = await createAdminClient();
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  await db.delete(userSettings).where(eq(userSettings.userId, id));

  return NextResponse.json({ success: true });
}
