'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSignIn, useSession } from '@saganta/stellar-appkit/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ErrorBlock } from '@/components/error-block';

export default function SiwsSessionMiddlewareDemo() {
  return (
    <DemoPageLayout slug="siws-session-middleware">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <Suspense fallback={<div className="empty-state">Loading…</div>}>
            <MiddlewareDemo />
          </Suspense>
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Next.js middleware runs on every request before the route
            handler. This demo uses it to protect{' '}
            <code>/protected/*</code> routes — requests without a valid
            SIWS session cookie are redirected here to sign in.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The middleware is in <code>src/middleware.ts</code>. It checks
            the <code>sak_session</code> cookie server-side. If valid, the
            request passes through; if not, it redirects to{' '}
            <code>/demos/siws-session-middleware?redirect=/protected/...</code>.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Try it:</strong> sign in below, then visit{' '}
            <a href="/protected/dashboard" style={{ color: 'var(--color-accent)' }}>
              /protected/dashboard
            </a>{' '}
            — you'll see the gated content. Then delete the cookie in
            DevTools and refresh — you'll be redirected back here.
          </p>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code (middleware.ts)" full>
          <CodeBlock code={CODE} language="typescript" />
        </DemoPanel>
      </div>
    </DemoPageLayout>
  );
}

function MiddlewareDemo() {
  const walletSession = useSession();
  const { sign, isSigning } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverSession, setServerSession] = useState<{ authenticated: boolean; address?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/siws/session').then((r) => r.json()).then(setServerSession).catch(() => {});
  }, []);

  const handleSignIn = async () => {
    if (!walletSession) return;
    setError(null);
    try {
      const { nonce } = await fetch('/api/siws/nonce').then((r) => r.json());
      const result = await sign({ statement: 'Sign in to access protected route', nonce });

      const res = await fetch('/api/siws/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: result.message,
          signedMessage: result.signedMessage,
          signedData: result.signedData,
          signerAddress: result.signerAddress,
          nonce,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.reason || 'Verification failed');
        return;
      }

      setServerSession({ authenticated: true, address: json.address });

      // Redirect to the originally requested page, or the dashboard by default.
      const redirect = searchParams.get('redirect') || '/protected/dashboard';
      router.push(redirect);
    } catch (err) {
      setError(String(err));
    }
  };

  if (!walletSession) {
    return (
      <div className="empty-state">
        Connect a wallet first (use the <strong>Connect a Wallet</strong> demo above).
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>Server session</div>
        {serverSession?.authenticated ? (
          <span className="status status--success">✓ authenticated</span>
        ) : (
          <span className="status">not authenticated</span>
        )}
      </div>

      {!serverSession?.authenticated ? (
        <button className="btn btn--primary" onClick={handleSignIn} disabled={isSigning}>
          {isSigning ? 'Signing...' : 'Sign in to access /protected'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <a href="/protected/dashboard" className="btn btn--primary">Visit protected dashboard →</a>
        </div>
      )}

      {error && (
        <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}

const CODE = `// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'sak_session';

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE);
  if (!cookie?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  try {
    const session = JSON.parse(cookie.value);
    if (Date.now() - session.issuedAt > 7 * 24 * 60 * 60 * 1000) {
      throw new Error('expired');
    }
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/protected/:path*'],
};`;
