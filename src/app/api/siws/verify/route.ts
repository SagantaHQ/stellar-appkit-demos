import { NextRequest, NextResponse } from 'next/server';
import { verifySiws } from '@saganta/stellar-appkit-siws-verify';

/**
 * Verifies a SIWS payload signed by the client.
 *
 * The client sends { message, signedMessage, signerAddress, signedData, nonce }.
 * The server calls verifySiws() with the expected domain (must match the
 * domain in the SIWS message) and the nonce it issued earlier.
 *
 * On success, sets a session cookie identifying the user. In production,
 * also issue a JWT or server-side session record — the cookie value here
 * is just the address for demo purposes.
 *
 * Returns the v1.7.x SiwsSession shape ({ network, address, expiry, metadata })
 * on success, plus the legacy `ok` + `address` fields for backward compat with
 * the original SIWS demos.
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
    const issuedAt = Date.now();
    const expiry = issuedAt + SESSION_MAX_AGE * 1000;
    const sessionValue = JSON.stringify({
      address: result.claims.address,
      issuedAt,
      expiry,
      nonce,
      network: 'TESTNET',
    });

    // v1.7.x SiwsSession shape — siwsConfig.verify() returns this
    // so the SDK can store it as the active SIWS session.
    const siwsSession = {
      network: 'TESTNET' as const,
      address: result.claims.address,
      expiry,
      metadata: {
        statement: 'Sign in to Stellar AppKit Demos',
      },
    };

    const res = NextResponse.json({
      // Legacy fields (used by /demos/siws-sign-in and /demos/siws-session-middleware):
      ok: true,
      // v1.7.x SiwsSession fields (used by siwsConfig.verify() in the
      // /demos/siws-session-management demo). The `address` field here
      // also serves as the legacy `address` field — same value.
      ...siwsSession,
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
