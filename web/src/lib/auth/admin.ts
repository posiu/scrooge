import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';

type AdminCheck =
  | { user: User; error: null; status: null }
  | { user: null; error: 'Unauthorized'; status: 401 }
  | { user: null; error: 'Forbidden'; status: 403 };

export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: 'Unauthorized', status: 401 };

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  });
  if (!settings?.isAdmin) return { user: null, error: 'Forbidden', status: 403 };

  return { user, error: null, status: null };
}
