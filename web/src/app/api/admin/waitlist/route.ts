import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';

export async function GET() {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const entries = await db.query.waitlistEntries.findMany({
    orderBy: (w, { desc }) => [desc(w.createdAt)],
  });

  return NextResponse.json(entries);
}
