import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { z } from 'zod';
import { LOCALES } from '@/i18n/config';

const SettingsSchema = z.object({
  locale: z.enum(LOCALES),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db.insert(userSettings)
    .values({ userId: user.id, locale: parsed.data.locale })
    .onConflictDoUpdate({ target: userSettings.userId, set: { locale: parsed.data.locale, updatedAt: new Date() } })
    .returning();

  return NextResponse.json(updated);
}
