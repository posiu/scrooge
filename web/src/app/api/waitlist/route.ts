import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlistEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const WaitlistSchema = z.object({
  email:     z.string().email(),
  firstName: z.string().min(1),
  consent:   z.literal(true, { errorMap: () => ({ message: 'Zgoda jest wymagana.' }) }),
});

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(`waitlist:${getClientIp(req)}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Provide a valid email, name and accept the consent' }, { status: 400 });
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
    consentAt: new Date(),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
