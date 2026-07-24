import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/roadmap', '/pricing', '/auth/callback'];

// ─── Domain split (production only — inert on localhost/preview hosts) ────────
// Marketing pages live on the apex domain; everything else belongs on the app
// subdomain. Both point at this same deployment, split purely by hostname.
const APEX_HOST = 'usescrooge.com';
const APP_HOST = 'app.usescrooge.com';
const MARKETING_PATHS = ['/', '/pricing', '/roadmap'];

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const pathname = request.nextUrl.pathname;
  const isApex = host === APEX_HOST || host === `www.${APEX_HOST}`;

  // Apex domain: only marketing pages, APIs, auth callback, and static files
  // (anything with a dot, e.g. manifest.json) are allowed to stay. Everything
  // else belongs to the app and gets sent to the app subdomain.
  if (
    isApex &&
    !MARKETING_PATHS.includes(pathname) &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/auth/') &&
    !pathname.includes('.')
  ) {
    const url = new URL(request.url);
    url.host = APP_HOST;
    return NextResponse.redirect(url);
  }

  // App subdomain has no marketing content — send its bare root to login.
  if (host === APP_HOST && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — do not use getUser() to avoid breaking session refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // API routes authenticate themselves and return JSON 401s — redirecting them
  // to the HTML login page would break every unauthenticated fetch() call.
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith('/auth/'),
  ) || pathname.startsWith('/api/');

  // Unauthenticated user tries to access protected route
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user tries to access login page
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
