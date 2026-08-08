import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'sak_session';

/**
 * Reads the SIWS session cookie and returns the verified session.
 *
 * Returns two shapes:
 *  - The legacy fields (`authenticated`, `address`, `issuedAt`) — used by the
 *    original /demos/siws-sign-in and /demos/siws-session-middleware demos.
 *  - The v1.7.x `SiwsSession` shape (`network`, `address`, `expiry`,
 *    `metadata?`) — used by the v1.7.x siwsConfig.session() callback and the
 *    /demos/siws-session-management demo.
 *
 * The cookie is httpOnly, so client JS can't read it directly — this endpoint
 * is the canonical "am I still logged in?" check on page load.
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
      network?: string;
      expiry?: number;
    };

    // For demo purposes, just check the cookie parses. In production,
    // verify the JWT signature (or look up the session ID in your DB).
    return NextResponse.json({
      // Legacy fields (used by the original SIWS demos):
      authenticated: true,
      issuedAt: session.issuedAt,
      // Shared between legacy and v1.7.x:
      address: session.address,
      // v1.7.x SiwsSession fields (used by siwsConfig.session() callback):
      network: session.network ?? 'TESTNET',
      expiry: session.expiry ?? (session.issuedAt + 7 * 24 * 60 * 60 * 1000),
      metadata: {
        statement: 'Sign in to Stellar AppKit Demos',
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
