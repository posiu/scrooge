import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { featureRequests, featureVotes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const FeatureRequestSchema = z.object({
  title:       z.string().min(5).max(100),
  description: z.string().min(10),
  authorName:  z.string().nullable().optional(),
  authorEmail: z.string().email().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const allRequests = await db.query.featureRequests.findMany({
    with: { votes: true, comments: true },
    orderBy: [desc(featureRequests.voteCount), desc(featureRequests.createdAt)],
  });

  const result = allRequests.map((r) => ({
    id:           r.id,
    title:        r.title,
    description:  r.description,
    status:       r.status,
    voteCount:    r.voteCount,
    authorName:   r.authorName,
    adminNote:    r.adminNote,
    createdAt:    r.createdAt,
    commentCount: r.comments.length,
    hasVoted:     user ? r.votes.some((v) => v.userId === user.id) : false,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const parsed = FeatureRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [created] = await db.insert(featureRequests).values({
    userId:      user?.id ?? null,
    title:       parsed.data.title,
    description: parsed.data.description,
    authorName:  parsed.data.authorName ?? null,
    authorEmail: parsed.data.authorEmail ?? null,
  }).returning();

  // Email notification to admin
  if (process.env.ADMIN_EMAIL) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:    'new_feature_request',
          title:   parsed.data.title,
          id:      created.id,
        }),
      });
    } catch {
      // non-critical
    }
  }

  return NextResponse.json(created, { status: 201 });
}
