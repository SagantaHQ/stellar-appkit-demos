'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAppKit } from '@saganta/stellar-appkit/react';
import type { WalletConnector, WalletReachability } from '@saganta/stellar-appkit';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ErrorBlock } from '@/components/error-block';

export default function MultiWalletListDemo() {
  return (
    <DemoPageLayout slug="multi-wallet-list">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <WalletPickerDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Instead of using the built-in modal, you can build your own wallet
            picker UI. The <code>StellarAppKit</code> client exposes a{' '}
            <code>registry.listReachability()</code> method that returns every
            registered connector with its current reachability status —
            <code>'available'</code>, <code>'locked'</code>,{' '}
            <code>'not-installed'</code>, or <code>'unavailable'</code>.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            Click a wallet in the list to connect — the connector's{' '}
            <code>meta.installUrl</code> provides Chrome/Firefox/etc. install
            links when the wallet isn't detected.
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

function WalletPickerDemo() {
  const client = useAppKit();
  const [wallets, setWallets] = useState<Array<{ connector: WalletConnector; reachability: WalletReachability }>>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    client.registry.listReachability().then((list) => {
      if (cancelled) return;
      setWallets(list);
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setError(String(err));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [client]);

  const connect = async (id: string) => {
    setConnecting(id);
    setError(null);
    try {
      const session = await client.connect(id);
      console.log('Connected:', session);
    } catch (err) {
      setError(String(err));
    } finally {
      setConnecting(null);
    }
  };

  if (loading) return <div className="empty-state">Loading wallet list…</div>;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {wallets.map(({ connector, reachability }) => (
          <button
            key={connector.id}
            className="btn"
            onClick={() => connect(connector.id)}
            disabled={reachability === 'not-installed' || connecting === connector.id}
            style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--color-surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                {connector.meta.name.charAt(0)}
              </span>
              <span style={{ fontWeight: 500 }}>{connector.meta.name}</span>
            </span>
            <span className={`status status--${reachability === 'available' ? 'success' : reachability === 'not-installed' ? 'error' : 'warning'}`}>
              {reachability}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}

const CODE = `import { useEffect, useState } from 'react';
import { useAppKit } from '@saganta/stellar-appkit/react';

function WalletPicker() {
  const client = useAppKit();
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    client.registry.listReachability().then(setWallets);
  }, [client]);

  return (
    <div>
      {wallets.map(({ connector, reachability }) => (
        <button
          key={connector.id}
          onClick={() => client.connect(connector.id)}
          disabled={reachability === 'not-installed'}
        >
          {connector.meta.name} — {reachability}
        </button>
      ))}
    </div>
  );
}`;
