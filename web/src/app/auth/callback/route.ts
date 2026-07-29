import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { LOCALE_COOKIE, resolveLocale } from '@/i18n/config';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`;
      const response = NextResponse.redirect(redirectUrl);

      // Seed the locale cookie from the user's saved preference on first
      // login on this browser — later visits/switches stay cookie-driven.
      if (data.user && !request.cookies.get(LOCALE_COOKIE)) {
        const settings = await db.query.userSettings.findFirst({
          where: eq(userSettings.userId, data.user.id),
          columns: { locale: true },
        });
        response.cookies.set(LOCALE_COOKIE, resolveLocale(settings?.locale), {
          path: '/', maxAge: 31536000, sameSite: 'lax',
        });
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
