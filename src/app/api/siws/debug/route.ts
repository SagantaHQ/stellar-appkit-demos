import { NextRequest, NextResponse } from 'next/server';
import { verifySiws } from '@saganta/stellar-appkit-siws-verify';

/**
 * Debug verification endpoint — returns the full diagnostics dump when
 * verification fails, showing every candidate byte sequence the verifier
 * tried and why each was rejected.
 *
 * Useful for debugging SIWS failures with new wallets. In production,
 * gate this behind an admin route or remove it.
 */
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const host = req.headers.get('host') ?? 'localhost';

  const result = await verifySiws(
    {
      message: body.message,
      signedMessage: body.signedMessage,
      signerAddress: body.signerAddress,
      signedData: body.signedData,
    },
    {
      expectedDomain: body.expectedDomain ?? host,
      expectedNonce: body.expectedNonce,
      debug: true, // ← enables the diagnostics dump
    }
  );

  return NextResponse.json(result);
}
