import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env';
import { buildCspHeader } from '@/lib/csp';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const matchesRoute = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);

  // CSP nonce — generated per-request, applied to ALL routes
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeaderValue = buildCspHeader(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeaderValue);

  // Protected routes - require authentication
  const protectedPaths = [
    '/app',
    '/bio',
    '/list',
    '/onboarding',
    '/settings',
    '/support',
    '/support-admin',
    '/update-password',
  ];
  // Protect specific paths and EXACTLY '/cashflow' (the private list)
  // Sub-paths like /cashflow/[id] are handled by the page logic for public access
  const isProtectedRoute =
    protectedPaths.some(matchesRoute) || pathname === '/cashflow';

  // Auth routes - redirect logged-in users
  const authPaths = ['/login', '/signup'];
  const isAuthRoute = authPaths.some(matchesRoute);

  // Public routes — still get CSP headers
  if (!isProtectedRoute && !isAuthRoute) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('Content-Security-Policy', cspHeaderValue);
    return response;
  }

  // Only create Supabase client when needed
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.headers.set('Content-Security-Policy', cspHeaderValue);

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          supabaseResponse.headers.set(
            'Content-Security-Policy',
            cspHeaderValue,
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Get user only when needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profile) {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
