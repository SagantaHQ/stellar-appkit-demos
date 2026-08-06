import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

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
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const nonce = randomBytes(16).toString('hex');
  return NextResponse.json({ nonce });
}
