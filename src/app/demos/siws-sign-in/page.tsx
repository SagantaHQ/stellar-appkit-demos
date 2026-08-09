'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSignIn, useSession } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';

export default function SiwsSignInDemo() {
  return (
    <DemoPageLayout slug="siws-sign-in">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <SiwsDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Full Sign-In With Stellar flow:
          </p>
          <ol style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
            <li>Client fetches a nonce from <code>/api/siws/nonce</code></li>
            <li>Client signs the SIWS message via <code>useSignIn()</code></li>
            <li>Client POSTs <code>{'{ message, signedMessage, signedData, signerAddress, nonce }'}</code> to <code>/api/siws/verify</code></li>
            <li>Server calls <code>verifySiws()</code> with the expected domain + nonce</li>
            <li>On success, server sets an httpOnly session cookie</li>
          </ol>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The <code>signedData</code> field is the magic that makes this
            work across wallets — every connector surfaces the exact bytes
            the wallet signed (base64), so the verifier doesn't need
            per-wallet logic. Freighter signs a SHA-256 hash
            (SEP-0053), Albedo signs a server-derived hash, xBull signs
            raw UTF-8 — the verifier tries all of them.
          </p>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code" full>
          <CodeBlock code={CODE} language="typescript" />
        </DemoPanel>
      </div>
    </DemoPageLayout>
  );
}

function SiwsDemo() {
  const walletSession = useSession();
  const { sign, isSigning, data, error } = useSignIn();
  const [serverSession, setServerSession] = useState<{ authenticated: boolean; address?: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; address?: string; reason?: string } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Check existing server session on mount
  useEffect(() => {
    fetch('/api/siws/session')
      .then((r) => r.json())
      .then(setServerSession)
      .catch(() => setServerSession({ authenticated: false }));
  }, []);

  const handleSignIn = async () => {
    if (!walletSession) return;
    setVerifyError(null);
    setVerifyResult(null);
    try {
      // 1. Fetch nonce
      const { nonce } = await fetch('/api/siws/nonce').then((r) => r.json());

      // 2. Sign SIWS message
      const signInResult = await sign({
        statement: 'Sign in to Stellar AppKit Examples',
        nonce,
      });

      // 3. Verify server-side
      const verifyRes = await fetch('/api/siws/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: signInResult.message,
          signedMessage: signInResult.signedMessage,
          signedData: signInResult.signedData,
          signerAddress: signInResult.signerAddress,
          nonce,
        }),
      });

      const verifyJson: { ok: boolean; address?: string; reason?: string } = await verifyRes.json();
      if (!verifyJson.ok) {
        setVerifyError(verifyJson.reason || 'Verification failed');
      } else {
        setVerifyResult(verifyJson);
        setServerSession({ authenticated: true, address: verifyJson.address });
      }
    } catch (err) {
      setVerifyError(String(err));
    }
  };

  const handleLogout = async () => {
    await fetch('/api/siws/logout', { method: 'POST' });
    setServerSession({ authenticated: false });
    setVerifyResult(null);
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
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>Wallet session</div>
        <div className="address">{walletSession.address}</div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>Server session</div>
        {serverSession?.authenticated ? (
          <span className="status status--success">
            ✓ authenticated as {serverSession.address?.slice(0, 8)}…
          </span>
        ) : (
          <span className="status">not authenticated</span>
        )}
      </div>

      {!serverSession?.authenticated ? (
        <button
          className="btn btn--primary"
          onClick={handleSignIn}
          disabled={isSigning}
        >
          {isSigning ? 'Sign the SIWS message...' : 'Sign in with Stellar'}
        </button>
      ) : (
        <button className="btn btn--danger" onClick={handleLogout}>
          Sign out
        </button>
      )}

      {data && (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            SIWS sign result
          </div>
          <div className="result-block">
            {JSON.stringify({
              message: data.message,
              signerAddress: data.signerAddress,
              signedData: data.signedData,
            }, null, 2)}
          </div>
        </>
      )}

      {verifyResult && (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Server verify result
          </div>
          <div className="result-block result-block--success">
            {JSON.stringify(verifyResult, null, 2)}
          </div>
        </>
      )}

      {(error || verifyError) && (
        <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
          {String(error || verifyError)}
        </div>
      )}
    </div>
  );
}

const CODE = `// ---- Client (React) ----
import { useSignIn, useSession } from '@saganta/stellar-appkit-ui-web/react';

function SignInButton() {
  const walletSession = useSession();
  const { sign } = useSignIn();

  async function handleSignIn() {
    // 1. Fetch nonce
    const { nonce } = await fetch('/api/siws/nonce').then(r => r.json());

    // 2. Sign SIWS message
    const result = await sign({
      statement: 'Sign in to My App',
      nonce,
    });

    // 3. Verify server-side
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

    const { ok, address } = await res.json();
    if (ok) console.log('Signed in as', address);
  }

  return <button onClick={handleSignIn}>Sign in with Stellar</button>;
}

// ---- Server (Next.js API route) ----
import { verifySiws } from '@saganta/stellar-appkit-siws-verify';

export async function POST(req) {
  const { message, signedMessage, signerAddress, signedData, nonce } = await req.json();

  const result = await verifySiws(
    { message, signedMessage, signerAddress, signedData },
    { expectedDomain: req.headers.get('host'), expectedNonce: nonce }
  );

  if (!result.ok) {
    return Response.json({ ok: false, reason: result.reason }, { status: 401 });
  }

  // Set session cookie, return success
  return Response.json({ ok: true, address: result.claims.address });
}`;
