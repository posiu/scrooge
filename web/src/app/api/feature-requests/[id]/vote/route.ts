import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { featureVotes, featureRequests } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await db.query.featureVotes.findFirst({
    where: and(
      eq(featureVotes.featureRequestId, id),
      eq(featureVotes.userId, user.id),
    ),
  });

  if (existing) {
    // Unvote
    await db.delete(featureVotes).where(eq(featureVotes.id, existing.id));
    await db
      .update(featureRequests)
      .set({ voteCount: sql`${featureRequests.voteCount} - 1` })
      .where(eq(featureRequests.id, id));
    return NextResponse.json({ voted: false });
  }

  // Vote
  await db.insert(featureVotes).values({
    featureRequestId: id,
    userId:           user.id,
  });
  await db
    .update(featureRequests)
    .set({ voteCount: sql`${featureRequests.voteCount} + 1` })
    .where(eq(featureRequests.id, id));

  return NextResponse.json({ voted: true });
}
