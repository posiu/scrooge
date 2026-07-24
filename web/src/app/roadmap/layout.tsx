import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AppShell } from '@/components/layout/AppShell';
import { Logo } from '@/components/layout/Logo';

export default async function RoadmapLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Public page — logged-in users get the full app shell, anonymous
  // visitors get a minimal bar so the page still feels part of the site.
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border">
          <Link href="/"><Logo /></Link>
        </div>
        {children}
      </div>
    );
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, user.id),
  });
  const isAdmin = settings?.isAdmin ?? false;

  return (
    <AppShell userEmail={user.email} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
