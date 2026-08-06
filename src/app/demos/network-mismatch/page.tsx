'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useConnect, useAppKit } from '@saganta/stellar-appkit/react';
import { NetworkMismatchError } from '@saganta/stellar-appkit';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { ErrorBlock } from '@/components/error-block';

export default function NetworkMismatchDemo() {
  return (
    <DemoPageLayout slug="network-mismatch">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <NetworkDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            When the user's wallet is on a different network than your app
            expects (e.g. wallet is on Public, app is on Testnet),{' '}
            <code>connect()</code> throws a typed{' '}
            <code>NetworkMismatchError</code> with{' '}
            <code>expectedNetwork</code> and <code>actualNetwork</code> fields.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            You can either handle it manually (show a message asking the user
            to switch networks in their extension) or use the auto-retry
            option — <code>connect(id, {'{ autoRetryNetworkMismatch: true }'})</code>{' '}
            polls until the user switches, then resolves automatically.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Try it:</strong> switch your Freighter extension to Public
            network, then click <em>Connect with auto-retry</em>. The button
            stays in "waiting" state until you switch back to Testnet.
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

function NetworkDemo() {
  const { isConnected } = useConnect();
  const client = useAppKit();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const handleConnect = async (autoRetry: boolean) => {
    setStatus('connecting');
    setError(null);
    setRetrying(autoRetry);
    try {
      // Use the raw client.connect() — it accepts the autoRetryNetworkMismatch option.
      // (The useConnect().connect wrapper is a thin version that doesn't pass opts.)
      await client.connect('freighter', { autoRetryNetworkMismatch: autoRetry });
      setStatus('success');
    } catch (err) {
      if (err instanceof NetworkMismatchError) {
        setStatus('error');
        setError(
          `NetworkMismatchError\n` +
          `  expected: ${err.expectedNetwork}\n` +
          `  actual:   ${err.actualNetwork}\n\n` +
          (autoRetry
            ? '(auto-retry was on but the user dismissed the prompt)'
            : 'Switch networks in your wallet extension and try again, or use auto-retry.')
        );
      } else {
        setStatus('error');
        setError(String(err));
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn--primary"
          onClick={() => handleConnect(false)}
          disabled={status === 'connecting' || retrying}
        >
          {status === 'connecting' && !retrying ? 'Connecting...' : 'Connect (manual)'}
        </button>
        <button
          className="btn"
          onClick={() => handleConnect(true)}
          disabled={status === 'connecting' || retrying}
        >
          {retrying ? 'Waiting for network switch...' : 'Connect with auto-retry'}
        </button>
      </div>

      {status === 'success' && (
        <div className="result-block result-block--success">
          ✓ Connected successfully!
        </div>
      )}

      {error && (
        <div className="result-block result-block--error">{error}</div>
      )}

      {retrying && (
        <div className="status status--warning" style={{ marginTop: '0.75rem' }}>
          Polling wallet network — switch to Testnet in your extension to continue.
        </div>
      )}
    </div>
  );
}

const CODE = `import { useConnect } from '@saganta/stellar-appkit/react';
import { NetworkMismatchError } from '@saganta/stellar-appkit';

function ConnectButton() {
  const { connect } = useConnect();

  async function handleConnect() {
    try {
      await connect('freighter'); // throws NetworkMismatchError if wrong network
    } catch (err) {
      if (err instanceof NetworkMismatchError) {
        console.log(\`Expected \${err.expectedNetwork}, wallet is on \${err.actualNetwork}\`);
      }
    }
  }

  // Or auto-retry:
  async function autoRetry() {
    await connect('freighter', { autoRetryNetworkMismatch: true });
    // Resolves once the user switches networks in their extension
  }

  return <button onClick={handleConnect}>Connect</button>;
}`;
