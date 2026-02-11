import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const matchesRoute = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);

  // Protected routes - require authentication
  const protectedPaths = [
    '/app',
    '/bio',
    '/cashflow',
    '/settings',
    '/support',
    '/support-admin',
    '/update-password',
  ];
  const isProtectedRoute = protectedPaths.some(matchesRoute);

  // Auth routes - redirect logged-in users
  const authPaths = ['/login', '/signup'];
  const isAuthRoute = authPaths.some(matchesRoute);

  // Skip auth check for public routes (landing, public profiles, etc.)
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  // Only create Supabase client when needed
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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
