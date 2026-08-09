'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { usePreviewTransaction, useSignTransaction } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';
import { ErrorBlock } from '@/components/error-block';

const RECIPIENT = 'GD5G3X25PD6IS3KEUV3QFF2BYXUY2OIUPIV5A5TMX4DSKASDN3EG7CJ6';

export default function CustomPreviewUIDemo() {
  return (
    <DemoPageLayout slug="custom-preview-ui">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <CustomPreviewDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            <code>usePreviewTransaction()</code> installs{' '}
            <code>client.onPreviewTransaction</code> under the hood — when{' '}
            <code>signTransaction()</code> is called, the client pauses and
            waits for <code>respond(approve)</code> before proceeding to the
            wallet.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            This lets you render your own preview UI instead of using the
            built-in modal's preview view. You get the decoded operations,
            risk flags, fee estimate, and balance deltas as reactive state.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Try it:</strong> click <em>Sign transaction</em> — your
            custom preview appears (not the modal). Approve or reject to
            continue.
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

function CustomPreviewDemo() {
  const { sign, isSigning } = useSignTransaction();
  const { preview, respond, isPending } = usePreviewTransaction();
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async (address: string) => {
    setError(null);
    setResult(null);
    try {
      const sdk = await import('@stellar/stellar-sdk');
      const account = await new sdk.rpc.Server('https://soroban-testnet.stellar.org').getAccount(address);
      const tx = new sdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: sdk.Networks.TESTNET,
      })
        .addOperation(sdk.Operation.payment({
          destination: RECIPIENT,
          asset: sdk.Asset.native(),
          amount: '1',
        }))
        .setTimeout(30)
        .build();

      const signed = await sign(tx.toXDR());
      setResult(signed);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <ConnectGate>
      {(session) => (
    <div>
      <button className="btn btn--primary" onClick={() => handleSign(session.address)} disabled={isSigning}>
        {isSigning ? 'Waiting for preview response...' : 'Sign transaction (custom preview)'}
      </button>

      {isPending && preview && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            Review transaction
          </div>

          {preview.operations && preview.operations.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="field__label" style={{ marginBottom: '0.25rem' }}>Operations</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                {preview.operations.map((op, i) => (
                  <li key={i}>{op.summary ?? JSON.stringify(op)}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.riskFlags && preview.riskFlags.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div className="field__label" style={{ marginBottom: '0.25rem' }}>Risk flags</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                {preview.riskFlags.map((flag, i) => (
                  <li key={i} style={{ color: flag.severity === 'danger' ? '#f87171' : flag.severity === 'warning' ? '#fbbf24' : 'inherit' }}>
                    {flag.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.feeEstimate && (
            <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Fee: <strong>{preview.feeEstimate.totalFeeXlm} XLM</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn--danger btn--sm" onClick={() => respond(false)}>
              Reject
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => respond(true)}>
              Approve
            </button>
          </div>
        </div>
      )}

      {result ? (
        <div className="result-block result-block--success" style={{ marginTop: '1rem' }}>
          {JSON.stringify(result, null, 2)}
        </div>
      ) : null}

      {error && (
        <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
    </div>
      )}
    </ConnectGate>
  );
}

const CODE = `import {
  usePreviewTransaction,
  useSignTransaction,
} from '@saganta/stellar-appkit-ui-web/react';

function CustomPreview() {
  const { sign } = useSignTransaction();
  const { preview, respond, isPending } = usePreviewTransaction();

  return (
    <>
      <button onClick={() => sign(xdr)}>Sign</button>

      {isPending && preview && (
        <div className="my-preview-ui">
          <ul>
            {preview.operations.map((op, i) => (
              <li key={i}>{op.summary}</li>
            ))}
          </ul>
          {preview.riskFlags.map((flag) => (
            <p className={flag.severity}>{flag.message}</p>
          ))}
          {preview.feeEstimate && (
            <p>Fee: {preview.feeEstimate.totalFeeXlm} XLM</p>
          )}
          <button onClick={() => respond(false)}>Reject</button>
          <button onClick={() => respond(true)}>Approve</button>
        </div>
      )}
    </>
  );
}`;
