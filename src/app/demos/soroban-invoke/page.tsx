'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSoroban, useSession } from '@saganta/stellar-appkit/react';
import { Networks } from '@stellar/stellar-sdk';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { ErrorBlock } from '@/components/error-block';

const TOKEN_CONTRACT = 'CBETT2CXOPPQQT2KWYKNHI6W2W2O2VJVUFPJQIBKDS2KSVV7DSOLQXOX'; // USDC on Testnet
const RPC_URL = 'https://soroban-testnet.stellar.org';

export default function SorobanInvokeDemo() {
  return (
    <DemoPageLayout slug="soroban-invoke">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <InvokeDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            <code>useSoroban()</code> returns an <code>invoke()</code> function
            that runs the full pipeline: build → simulate → preview → sign →
            submit → poll. One call, end-to-end.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The modal opens automatically for the sign step with a
            Soroban-specific preview showing balance deltas and fee estimate.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            This demo calls <code>balance(address)</code> on the Testnet USDC
            token contract — a read-only simulation, no signing required. Click{' '}
            <strong>Preview invoke</strong> to see the simulation result
            without signing; click <strong>Invoke</strong> for the full
            pipeline (will prompt your wallet).
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

function InvokeDemo() {
  const session = useSession();
  const { invoke, previewInvoke, status, lastResult, error } = useSoroban({
    rpcUrl: RPC_URL,
    networkPassphrase: Networks.TESTNET,
  });
  const [preview, setPreview] = useState<unknown>(null);

  if (!session) {
    return (
      <div className="empty-state">
        Connect a wallet first (use the <strong>Connect a Wallet</strong> demo above).
      </div>
    );
  }

  const args = [session.address];

  const handlePreview = async () => {
    try {
      const result = await previewInvoke({
        contractId: TOKEN_CONTRACT,
        method: 'balance',
        args,
      });
      setPreview(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvoke = async () => {
    try {
      await invoke({
        contractId: TOKEN_CONTRACT,
        method: 'balance',
        args,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="field">
        <label className="field__label">Contract</label>
        <input className="field__input" value={TOKEN_CONTRACT} readOnly />
      </div>
      <div className="field">
        <label className="field__label">Method</label>
        <input className="field__input" value="balance" readOnly />
      </div>
      <div className="field">
        <label className="field__label">Args</label>
        <input className="field__input" value={`[${session.address}]`} readOnly />
      </div>

      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
        <button className="btn" onClick={handlePreview}>
          Preview invoke (simulate only)
        </button>
        <button
          className="btn btn--primary"
          onClick={handleInvoke}
          disabled={status === 'invoking'}
        >
          {status === 'invoking' ? 'Invoking...' : 'Invoke (full pipeline)'}
        </button>
      </div>

      {preview ? (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Preview result (simulation)
          </div>
          <div className="result-block">
            {JSON.stringify(preview, null, 2)}
          </div>
        </>
      ) : null}

      {lastResult && (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Invoke result
          </div>
          <div className="result-block result-block--success">
            {JSON.stringify(lastResult, null, 2)}
          </div>
        </>
      )}

      <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
    </div>
  );
}

const CODE = `import { useSoroban, useSession } from '@saganta/stellar-appkit/react';
import { Networks } from '@stellar/stellar-sdk';

function TokenBalance() {
  const session = useSession();
  const { invoke, previewInvoke, status, lastResult } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });

  async function checkBalance() {
    // Read-only simulation — no signing, no wallet prompt
    const preview = await previewInvoke({
      contractId: 'CBETT2CX...',
      method: 'balance',
      args: [session.address],
    });
    console.log(preview);
  }

  async function transfer(to: string, amount: bigint) {
    // Full pipeline: build → simulate → preview (modal opens) → sign → submit → poll
    const result = await invoke({
      contractId: 'CBETT2CX...',
      method: 'transfer',
      args: [session.address, to, amount],
    });
    console.log(result);
  }

  return <button onClick={checkBalance}>Check balance</button>;
}`;
