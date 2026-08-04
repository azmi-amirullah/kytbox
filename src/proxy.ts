import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env';
import { buildCspHeader } from '@/lib/csp';
import { getCookieDomain, isAllowedOrigin } from '@/lib/origin';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const matchesRoute = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);

  const origin = request.headers.get('origin') || '';
  const isAllowedCors = origin && isAllowedOrigin(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Rsc, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, Content-Type, Authorization, x-nonce, sentry-trace, baggage',
    'Access-Control-Allow-Credentials': 'true',
  };

  const applyCorsHeaders = (res: NextResponse) => {
    if (isAllowedCors) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.headers.set(key, value);
      });
    }
    return res;
  };

  if (request.method === 'OPTIONS' && isAllowedCors) {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const hostname = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  const scheme = `${proto}://`;
  const port = request.nextUrl.port ? `:${request.nextUrl.port}` : '';
  const cleanHost = hostname.replace(`:${request.nextUrl.port}`, '').replace(/^www\./, '').replace(/^app\./, '');

  const allowedOrigins = [
    `${scheme}${cleanHost}${port}`,
    `${scheme}app.${cleanHost}${port}`,
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const siteOrigin = new URL(siteUrl).origin;
      const siteHost = new URL(siteUrl).hostname;
      const cleanSiteHost = siteHost.replace(/^www\./, '').replace(/^app\./, '');
      const siteAppOrigin = `${new URL(siteUrl).protocol}//app.${cleanSiteHost}`;
      allowedOrigins.push(siteOrigin);
      allowedOrigins.push(siteAppOrigin);
    } catch {
      // Ignore invalid URL format
    }
  }

  const uniqueAllowedOrigins = Array.from(new Set(allowedOrigins));

  // CSP nonce — generated per-request, applied to ALL routes
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeaderValue = buildCspHeader(nonce, uniqueAllowedOrigins);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeaderValue);

  const isAppSubdomain = hostname.startsWith('app.');

  // 1. If on app subdomain (app.kytbox.com or app.localhost):
  if (isAppSubdomain) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return applyCorsHeaders(NextResponse.redirect(url));
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
      '/cashflow/goal',
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
      return applyCorsHeaders(NextResponse.redirect(appUrl));
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
    '/cashflow/goal',
  ];
  // Protect specific paths and EXACTLY '/cashflow' (the private list).
  // Cashflow detail pages remain public, while goal detail pages are private.
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
    return applyCorsHeaders(response);
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
          const cookieDomain = getCookieDomain();

          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Copy the updated Cookie header from request.headers to requestHeaders
          // so that the downstream route has the refreshed cookies AND the security headers (like x-nonce).
          const cookieHeader = request.headers.get('cookie');
          if (cookieHeader) {
            requestHeaders.set('cookie', cookieHeader);
          } else {
            requestHeaders.delete('cookie');
          }

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
    error: authError,
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
    if (authError) console.error('[proxy] Auth check failed on protected route:', authError.message);
    return applyCorsHeaders(NextResponse.redirect(getAppSubdomainUrl('/login')));
  }

  // Redirect logged-in users away from auth pages directly to /app on app subdomain
  if (isAuthRoute && user) {
    return applyCorsHeaders(NextResponse.redirect(getAppSubdomainUrl('/app')));
  }

  return applyCorsHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
