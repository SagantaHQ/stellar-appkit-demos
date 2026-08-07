'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAppKit } from '@saganta/stellar-appkit/react';
import { SorobanConnection } from '@saganta/stellar-appkit';
import { Networks } from '@stellar/stellar-sdk';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ErrorBlock } from '@/components/error-block';

const PRIMARY_RPC = 'https://soroban-testnet.stellar.org';
const BACKUP_RPC = 'https://rpc-backup.example.com'; // intentionally bad — to demonstrate failover

export default function SorobanFailoverDemo() {
  return (
    <DemoPageLayout slug="soroban-failover">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <FailoverDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Pass <code>rpcUrls: [...]</code> instead of <code>rpcUrl: '...'</code>{' '}
            and the connection transparently fails over to the next provider
            on network errors or 5xx responses. Each provider has a 30-second
            health cooldown after a failure.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <code>getFailoverStatus()</code> returns the current health of
            each provider — useful for showing a status panel in production.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            This demo constructs a <code>SorobanConnection</code> directly
            (instead of <code>useSoroban()</code>) because the React hook
            only accepts a single <code>rpcUrl</code> — failover is a
            lower-level feature. The same pattern works in vanilla JS.
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

function FailoverDemo() {
  const client = useAppKit();
  const [status, setStatus] = useState<Array<{ url: string; healthy: boolean; failureCount: number }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Construct a SorobanConnection with multiple RPC URLs — the
      // connection will fail over from primary to backup on errors.
      const soroban = new SorobanConnection({
        rpcUrls: [PRIMARY_RPC, BACKUP_RPC],
        networkPassphrase: Networks.TESTNET,
        wallet: client,
      });
      const s = soroban.getFailoverStatus();
      setStatus(s as Array<{ url: string; healthy: boolean; failureCount: number }>);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="field">
        <label className="field__label">Primary RPC</label>
        <input className="field__input" value={PRIMARY_RPC} readOnly />
      </div>
      <div className="field">
        <label className="field__label">Backup RPC</label>
        <input className="field__input" value={BACKUP_RPC} readOnly />
      </div>

      <button className="btn btn--primary" onClick={checkHealth} disabled={loading}>
        {loading ? 'Checking...' : 'Check failover status'}
      </button>

      {status ? (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Failover status
          </div>
          <div className="result-block">
            {JSON.stringify(status, null, 2)}
          </div>
        </>
      ) : null}

      <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
    </div>
  );
}

const CODE = `import { SorobanConnection } from '@saganta/stellar-appkit';
import { Networks } from '@stellar/stellar-sdk';

// Construct with rpcUrls (plural) instead of rpcUrl to enable failover
const soroban = new SorobanConnection({
  rpcUrls: [
    'https://soroban-testnet.stellar.org',
    'https://rpc-backup.example.com',
  ],
  networkPassphrase: Networks.TESTNET,
  wallet: appkit, // a StellarAppKit instance
  failoverOptions: {
    unhealthyCooldownMs: 30_000,
    onFailover: ({ method, error }) => {
      console.warn(\`Failover on \${method}: \${error}\`);
    },
  },
});

// Check provider health
const status = soroban.getFailoverStatus();
// → [{ url, healthy, failureCount }, ...]

// invoke() transparently fails over if the primary errors out
const result = await soroban.invoke({
  contractId: 'CBETT2CX...',
  method: 'transfer',
  args,
});`;
