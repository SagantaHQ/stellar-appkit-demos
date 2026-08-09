'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSignIn } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';
import { ErrorBlock } from '@/components/error-block';

export default function SiwsDebugVerificationDemo() {
  return (
    <DemoPageLayout slug="siws-debug-verification">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <DebugDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Pass <code>debug: true</code> to <code>verifySiws()</code> and on
            failure it returns a <code>diagnostics</code> field listing every
            candidate byte sequence the verifier tried, with the reason each
            was rejected.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The verifier tries 8+ candidates: raw UTF-8, SHA-256, SHA-512,
            domain-prefixed, CRLF variants, and the SEP-0053 hash
            (<code>sha256("Stellar Signed Message:\n" + message)</code>{' '}
            — what Freighter signs).
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            This demo lets you trigger a failure by tampering with the
            signed data, then shows the full diagnostics dump.
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

function DebugDemo() {
  const { sign, isSigning, data } = useSignIn();
  const [diagnostics, setDiagnostics] = useState<unknown>(null);
  const [tamper, setTamper] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignAndVerify = async () => {
    setError(null);
    setDiagnostics(null);
    try {
      const { nonce } = await fetch('/api/siws/nonce').then((r) => r.json());
      const result = await sign({ statement: 'Debug verification test', nonce });

      // Optionally tamper with the signed data to force a failure
      const originalData = result.signedData ?? '';
      const signedData = tamper
        ? originalData.slice(0, -4) + 'AAAA'
        : originalData;

      const res = await fetch('/api/siws/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: result.message,
          signedMessage: result.signedMessage,
          signedData,
          signerAddress: result.signerAddress,
          expectedNonce: nonce,
        }),
      });

      const json = await res.json();
      setDiagnostics(json);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <ConnectGate>
      {(session) => (
        <div>
          <div className="field">
            <label className="field__label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={tamper}
                onChange={(e) => setTamper(e.target.checked)}
              />
              Tamper with signedData (force verification failure)
            </label>
          </div>

          <button className="btn btn--primary" onClick={handleSignAndVerify} disabled={isSigning}>
            {isSigning ? 'Signing...' : 'Sign & verify (with debug)'}
          </button>

          {data && (
            <>
              <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
                Sign result
              </div>
              <div className="result-block" style={{ maxHeight: '120px' }}>
                {JSON.stringify({
                  signedData: data.signedData,
                  signerAddress: data.signerAddress,
                }, null, 2)}
              </div>
            </>
          )}

          {diagnostics ? (
            <>
              <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
                Verification result {tamper ? '(tampered — should fail)' : '(should succeed)'}
              </div>
              <div className={`result-block ${tamper ? 'result-block--error' : 'result-block--success'}`}>
                {JSON.stringify(diagnostics, null, 2)}
              </div>
            </>
          ) : null}

          <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
        </div>
      )}
    </ConnectGate>
  );
}

const CODE = `// Server-side: pass debug: true to get the diagnostics dump
import { verifySiws } from '@saganta/stellar-appkit-siws-verify';

const result = await verifySiws(
  { message, signedMessage, signerAddress, signedData },
  {
    expectedDomain: 'app.example.com',
    expectedNonce,
    debug: true, // ← enables diagnostics
  }
);

if (!result.ok) {
  console.log(result.reason);
  console.log(result.diagnostics);
  // → {
  //   candidatesTried: [
  //     { name: 'utf8', bytes: '...', reason: 'signature mismatch' },
  //     { name: 'sha256', bytes: '...', reason: 'signature mismatch' },
  //     { name: 'sep0053', bytes: '...', reason: 'signature mismatch' },
  //     ...
  //   ]
  // }
}`;
