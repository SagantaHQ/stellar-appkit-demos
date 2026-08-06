'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSignMessage, useSession } from '@saganta/stellar-appkit/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { ErrorBlock } from '@/components/error-block';

export default function SignMessageDemo() {
  return (
    <DemoPageLayout slug="sign-message">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <SignMessageDemoInner />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            <code>useSignMessage()</code> signs an arbitrary string with the
            active wallet. The result includes:
          </p>
          <ul style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
            <li><code>signedMessage</code> — the raw signed bytes</li>
            <li><code>signedData</code> — base64 of the exact bytes the wallet signed (critical for SIWS verification)</li>
            <li><code>signerAddress</code> — the address that signed</li>
          </ul>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The <code>signedData</code> field is what makes SIWS verification
            work across wallets — every connector surfaces the exact bytes
            it signed, so the verifier doesn't need per-wallet logic.
          </p>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code" full>
          <pre>{CODE}</pre>
        </DemoPanel>
      </div>
    </DemoPageLayout>
  );
}

function SignMessageDemoInner() {
  const session = useSession();
  const { sign, isSigning, data, error } = useSignMessage();
  const [message, setMessage] = useState('Hello, Stellar!');

  if (!session) {
    return (
      <div className="empty-state">
        Connect a wallet first (use the <strong>Connect a Wallet</strong> demo above).
      </div>
    );
  }

  const handleSign = async () => {
    try {
      await sign(message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="field">
        <label className="field__label">Message to sign</label>
        <input
          className="field__input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hello, Stellar!"
        />
      </div>

      <button className="btn btn--primary" onClick={handleSign} disabled={isSigning || !message}>
        {isSigning ? 'Check your wallet...' : 'Sign message'}
      </button>

      {data && (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Result
          </div>
          <div className="result-block result-block--success">
            {JSON.stringify({
              signedMessage: data.signedMessage ?? null,
              signedData: data.signedData,
              signerAddress: data.signerAddress,
            }, null, 2)}
          </div>
        </>
      )}

      <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
    </div>
  );
}

const CODE = `import { useSignMessage, useSession } from '@saganta/stellar-appkit/react';

function MessageSigner() {
  const session = useSession();
  const { sign, isSigning, data, error } = useSignMessage();

  return (
    <>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button disabled={isSigning} onClick={() => sign('Hello, Stellar!')}>
        Sign message
      </button>
      {data && (
        <ul>
          <li>signedMessage: {data.signedMessage}</li>
          <li>signedData: {data.signedData}</li>
          <li>signerAddress: {data.signerAddress}</li>
        </ul>
      )}
    </>
  );
}`;
