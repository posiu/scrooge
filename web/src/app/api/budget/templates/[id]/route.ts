import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { budgetTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const template = await db.query.budgetTemplates.findFirst({
    where: and(eq(budgetTemplates.id, id), eq(budgetTemplates.userId, user.id)),
  });
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(budgetTemplates).where(eq(budgetTemplates.id, id));
  return NextResponse.json({ success: true });
}
