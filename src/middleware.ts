import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware — runs on every request before the route handler.
 *
 * This demo protects /protected/* by checking for the SIWS session cookie
 * server-side. If the cookie is missing or invalid, the user is redirected
 * to the SIWS sign-in demo.
 *
 * In production you'd also verify a JWT signature here (or look up the
 * session ID in your DB / KV). For this demo we just check the cookie
 * exists and parses.
 *
 * Note: middleware runs on the Edge runtime by default, which is why we
 * keep the logic synchronous and avoid importing @saganta/stellar-appkit
 * here (it's a heavier bundle). The full verifySiws() happens in the
 * /api/siws/verify route, which runs on the Node runtime.
 */
const SESSION_COOKIE = 'sak_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate /protected/* — everything else passes through.
  if (!pathname.startsWith('/protected')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE);

  if (!cookie?.value) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = '/demos/siws-session-middleware';
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const session = JSON.parse(cookie.value) as { address: string; issuedAt: number };
    if (!session.address || typeof session.issuedAt !== 'number') {
      throw new Error('Invalid session shape');
    }

    // Optional: check session age
    const ageMs = Date.now() - session.issuedAt;
    const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
    if (ageMs > MAX_AGE_MS) {
      throw new Error('Session expired');
    }

    // Pass through — the route handler will run next.
    return NextResponse.next();
  } catch {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = '/demos/siws-session-middleware';
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  // Run middleware on /protected/* and the API routes (so we can read
  // the cookie in the session check API too).
  matcher: ['/protected/:path*', '/api/siws/session'],
};
