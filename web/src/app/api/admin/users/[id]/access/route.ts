import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { z } from 'zod';

// GoTrue has no dedicated "permanent ban" — a very long ban_duration is the
// standard workaround. Displayed in the UI as "Zablokowany".
const PERMANENT_BLOCK_DURATION = '876000h'; // ~100 years

const AccessSchema = z.object({
  action: z.enum(['block', 'suspend', 'unblock']),
  days:   z.coerce.number().int().positive().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: 'Nie możesz zmienić dostępu własnego konta' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = AccessSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  let banDuration: string;
  if (data.action === 'block') {
    banDuration = PERMANENT_BLOCK_DURATION;
  } else if (data.action === 'unblock') {
    banDuration = 'none';
  } else {
    if (!data.days) return NextResponse.json({ error: 'Podaj liczbę dni zawieszenia' }, { status: 400 });
    banDuration = `${data.days * 24}h`;
  }

  const supabaseAdmin = await createAdminClient();
  const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: banDuration,
  });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({
    id: updated.user.id,
    bannedUntil: updated.user.banned_until && updated.user.banned_until !== 'none' ? updated.user.banned_until : null,
  });
}
