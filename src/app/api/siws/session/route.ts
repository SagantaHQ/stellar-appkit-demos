import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'sak_session';

/**
 * Reads the SIWS session cookie and returns the verified address.
 *
 * Used by the client to check "am I still logged in?" on page load —
 * the cookie is httpOnly so client JS can't read it directly.
 */
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE);

  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const session = JSON.parse(cookie.value) as {
      address: string;
      issuedAt: number;
      nonce: string;
    };

    // For demo purposes, just check the cookie parses. In production,
    // verify the JWT signature (or look up the session ID in your DB).
    return NextResponse.json({
      authenticated: true,
      address: session.address,
      issuedAt: session.issuedAt,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
