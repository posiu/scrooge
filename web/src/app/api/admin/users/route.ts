import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1),
  lastName:  z.string().nullable().optional(),
  currency:  z.string().default('PLN'),
  plan:      z.enum(['free', 'basic', 'pro']).default('free'),
});

export async function GET() {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const supabaseAdmin = await createAdminClient();
  const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const settingsRows = await db.query.userSettings.findMany();
  const settingsMap = new Map(settingsRows.map((s) => [s.userId, s]));

  const users = data.users
    .map((u) => {
      const s = settingsMap.get(u.id);
      return {
        id:           u.id,
        email:        u.email ?? '',
        firstName:    s?.firstName ?? '',
        lastName:     s?.lastName ?? null,
        plan:         s?.plan ?? 'free',
        currency:     s?.currency ?? 'PLN',
        isAdmin:      s?.isAdmin ?? false,
        createdAt:    u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        bannedUntil:  u.banned_until && u.banned_until !== 'none' ? u.banned_until : null,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data } = parsed;
  const supabaseAdmin = await createAdminClient();
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Nie udało się utworzyć użytkownika' }, { status: 400 });
  }

  const [settings] = await db.insert(userSettings).values({
    userId:    created.user.id,
    firstName: data.firstName,
    lastName:  data.lastName ?? null,
    currency:  data.currency,
    plan:      data.plan,
  }).returning();

  return NextResponse.json({ ...settings, id: created.user.id, email: created.user.email }, { status: 201 });
}
