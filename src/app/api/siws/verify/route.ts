import { NextRequest, NextResponse } from 'next/server';
import { verifySiws } from '@saganta/stellar-appkit-siws-verify';

/**
 * Verifies a SIWS payload signed by the client.
 *
 * The client sends { message, signedMessage, signerAddress, signedData }.
 * The server calls verifySiws() with the expected domain (must match the
 * domain in the SIWS message) and the nonce it issued earlier.
 *
 * On success, sets a session cookie identifying the user. In production,
 * also issue a JWT or server-side session record — the cookie value here
 * is just the address for demo purposes.
 */
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'sak_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  let body: {
    message: string;
    signedMessage: string;
    signerAddress: string;
    signedData: string;
    nonce: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON body' }, { status: 400 });
  }

  const { message, signedMessage, signerAddress, signedData, nonce } = body;

  if (!message || !signedMessage || !signerAddress || !signedData || !nonce) {
    return NextResponse.json(
      { ok: false, reason: 'Missing required fields' },
      { status: 400 }
    );
  }

  const host = req.headers.get('host') ?? 'localhost';

  try {
    const result = await verifySiws(
      { message, signedMessage, signerAddress, signedData },
      {
        expectedDomain: host,
        expectedNonce: nonce,
      }
    );

    if (!result.ok || !result.claims) {
      return NextResponse.json(
        { ok: false, reason: result.reason || 'Verification failed' },
        { status: 401 }
      );
    }

    // Verification succeeded — set a session cookie.
    // In production: sign this value as a JWT, or store a server-side
    // session record keyed by a random ID. The address alone isn't a
    // secure session token (it's public information).
    const sessionValue = JSON.stringify({
      address: result.claims.address,
      issuedAt: Date.now(),
      nonce,
    });

    const res = NextResponse.json({
      ok: true,
      address: result.claims.address,
    });

    res.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: String(err) },
      { status: 500 }
    );
  }
}
