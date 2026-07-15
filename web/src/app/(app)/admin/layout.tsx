import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  });
  if (!settings?.isAdmin) redirect('/dashboard');

  return <>{children}</>;
}
