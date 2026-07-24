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

  const hostname = request.headers.get('host') || '';
  const isAppSubdomain = hostname.startsWith('app.');

  // 1. If on app subdomain (app.kytbox.com or app.localhost):
  if (isAppSubdomain) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return NextResponse.redirect(url);
    }
  } else {
    // 2. If on root apex domain (kytbox.com or localhost):
    // Redirect platform routes AND auth routes to app subdomain so login is saved on app subdomain
    const platformRoutes = [
      '/app',
      '/bio',
      '/list',
      '/onboarding',
      '/settings',
      '/support',
      '/support-admin',
      '/update-password',
      '/login',
      '/signup',
    ];
    const isPlatformRoute =
      platformRoutes.some(matchesRoute) || pathname === '/cashflow';

    if (isPlatformRoute) {
      // Determine app subdomain host
      const port = request.nextUrl.port ? `:${request.nextUrl.port}` : '';
      const baseHost = hostname.replace(`:${request.nextUrl.port}`, '').replace(/^www\./, '');
      const targetHost = `app.${baseHost}${port}`;

      const appUrl = new URL(request.nextUrl.toString());
      appUrl.host = targetHost;
      return NextResponse.redirect(appUrl);
    }
  }

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
          const cookieDomain =
            env.NODE_ENV === 'production'
              ? `.${new URL(env.NEXT_PUBLIC_SITE_URL).hostname.replace(/^www\./, '')}`
              : undefined;

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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            }),
          );
        },
      },
    },
  );

  // Get user only when needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper to construct app subdomain URL
  const getAppSubdomainUrl = (targetPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    if (!hostname.startsWith('app.')) {
      const port = request.nextUrl.port ? `:${request.nextUrl.port}` : '';
      const baseHost = hostname.replace(`:${request.nextUrl.port}`, '').replace(/^www\./, '');
      url.host = `app.${baseHost}${port}`;
    }
    return url;
  };

  // Protect routes — redirect unauthenticated users to /login on app subdomain
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(getAppSubdomainUrl('/login'));
  }

  // Redirect logged-in users away from auth pages directly to /app on app subdomain
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profile) {
      return NextResponse.redirect(getAppSubdomainUrl('/app'));
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
