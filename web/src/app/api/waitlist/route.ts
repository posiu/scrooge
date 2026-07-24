import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlistEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const WaitlistSchema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Podaj prawidłowy adres email i imię.' }, { status: 400 });
  }

  const { data } = parsed;
  const existing = await db.query.waitlistEntries.findFirst({
    where: eq(waitlistEntries.email, data.email),
  });
  if (existing) {
    return NextResponse.json({ success: true, alreadyOnList: true });
  }

  await db.insert(waitlistEntries).values({
    email:     data.email,
    firstName: data.firstName,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
