import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import crypto from 'crypto';

// Rotates the target user's password to a cryptographically random value that
// is never returned, logged, or stored — the account becomes effectively
// password-less (OTP remains the only usable login path) without needing a
// password-reset email flow.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin();
  if (!user) return NextResponse.json({ error }, { status });

  const { id } = await params;
  const randomPassword = crypto.randomBytes(32).toString('base64url');

  const supabaseAdmin = await createAdminClient();
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, { password: randomPassword });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
