import { NextResponse } from 'next/server';

/**
 * Issues a nonce for the SIWS flow.
 *
 * The nonce ties a specific sign-in attempt to a server-issued challenge —
 * the client must include it in the SIWS message, and the server verifies
 * it matches during the /verify call. This prevents replay attacks: an
 * attacker who intercepts the signed message can't reuse it later because
 * the nonce is single-use (in production, store it in a DB with TTL).
 *
 * For this demo we just generate a random hex string. In production, also
 * store it server-side keyed by the session ID and delete it on use.
 *
 * Uses the Web Crypto API (crypto.getRandomValues) instead of node:crypto
 * so it works on Cloudflare Workers (which doesn't have node:crypto by
 * default, even with nodejs_compat).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return NextResponse.json({ nonce });
}
