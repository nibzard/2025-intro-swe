import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - require login
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/forum') ||
      request.nextUrl.pathname.startsWith('/admin'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Check email verification and ban status for logged-in users accessing protected routes
  if (user && (
    request.nextUrl.pathname.startsWith('/forum') ||
    request.nextUrl.pathname.startsWith('/admin')
  )) {
    // Don't redirect if already on verify-email or banned page
    if (!request.nextUrl.pathname.startsWith('/auth/verify-email') &&
        !request.nextUrl.pathname.startsWith('/auth/banned')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified, role, is_banned, ban_reason')
        .eq('id', user.id)
        .single();

      // Redirect to banned page if user is banned
      if (profile && (profile as any).is_banned) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/banned';
        return NextResponse.redirect(url);
      }

      // Redirect to verify-email if not verified
      if (profile && !profile.email_verified) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/verify-email';
        return NextResponse.redirect(url);
      }

      // Admin only routes
      if (request.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/forum';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
