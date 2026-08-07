'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useConnect, useSession } from '@saganta/stellar-appkit-ui-web/react';
import { QRCodeSVG } from 'qrcode.react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import {
  setWalletConnectUriListener,
  isWalletConnectEnabled,
} from '@/components/appkit-provider';

export default function WalletConnectDemo() {
  const wcEnabled = isWalletConnectEnabled();

  return (
    <DemoPageLayout slug="walletconnect">
      {!wcEnabled ? (
        <div className="demo-page__layout">
          <DemoPanel title="WalletConnect not configured" full>
            <div className="empty-state">
              <div className="empty-state__icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p style={{ margin: 0, marginBottom: '0.5rem' }}>
                This demo requires a <code>NEXT_PUBLIC_REOWN_PROJECT_ID</code> environment variable.
              </p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Get a free project ID at{' '}
                <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>
                  cloud.walletconnect.com
                </a>{' '}
                and add it to your environment. See the setup instructions below.
              </p>
            </div>
          </DemoPanel>
          <SetupPanel />
        </div>
      ) : (
        <>
          <WalletConnectDemoInner />
          <div style={{ marginTop: '1.5rem' }}>
            <SetupPanel />
          </div>
        </>
      )}
    </DemoPageLayout>
  );
}

function WalletConnectDemoInner() {
  const { connect, isConnected, isConnecting } = useConnect();
  const session = useSession();
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to WalletConnect pairing URIs from the connector.
  // The connector fires onUri(uri) when it generates a pairing code,
  // which happens during connect() — before the wallet approves.
  useEffect(() => {
    setWalletConnectUriListener((uri) => {
      setWcUri(uri);
    });
    return () => {
      setWalletConnectUriListener(null);
      setWcUri(null);
    };
  }, []);

  // Clear the URI once connected (the QR is no longer needed)
  useEffect(() => {
    if (isConnected && wcUri) {
      setWcUri(null);
    }
  }, [isConnected, wcUri]);

  // Clear error when a new connection attempt starts
  useEffect(() => {
    if (isConnecting) setError(null);
  }, [isConnecting]);

  const handleConnect = async () => {
    setError(null);
    setWcUri(null);
    try {
      // Call connect('walletconnect') directly — NOT via the modal.
      // This lets us render the QR code on the page itself, which is
      // the correct UX for WalletConnect (the QR IS the connection UI).
      // The modal also supports WC QR rendering (via setOnUri), but for
      // this demo we show it on the page so you can see both approaches.
      await connect('walletconnect');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setWcUri(null);
    }
  };

  // --- Connected state ---
  if (isConnected && session) {
    return (
      <div className="demo-page__layout">
        <DemoPanel title="Connected" full>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="status status--success" style={{ alignSelf: 'flex-start' }}>connected</div>
            <div className="field__label">Connected address</div>
            <div className="address">{session.address}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Wallet: <code>{session.walletId}</code> · Network: <code>{session.network}</code>
            </div>
          </div>
        </DemoPanel>
      </div>
    );
  }

  // --- Connecting / idle state ---
  return (
    <div className="demo-page__layout">
      <DemoPanel title="Live demo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn--primary"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect WalletConnect'}
            </button>
          </div>

          {/* QR code panel — shows when a pairing URI is available */}
          {wcUri && !isConnected && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.5rem',
              background: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                lineHeight: 0,
              }}>
                <QRCodeSVG value={wcUri} size={220} marginSize={1} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Scan with Hana, Lobstr, or Hot Wallet
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Open your wallet app and scan this QR code to connect.
                </div>
              </div>
              {/* Deep link button for mobile users */}
              <a
                href={wcUri}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                }}
              >
                Or open in wallet app →
              </a>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="result-block result-block--error">
              <strong>Connection failed:</strong> {error}
            </div>
          )}

          {/* Idle state — before clicking connect */}
          {!wcUri && !isConnecting && !error && (
            <div className="empty-state">
              <div className="empty-state__icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              Click <strong>Connect WalletConnect</strong> to generate a QR code.
            </div>
          )}

          {/* Loading state — connecting but no URI yet */}
          {isConnecting && !wcUri && (
            <div className="empty-state">
              <div className="empty-state__icon">
                <div className="wallet-list-loading" />
              </div>
              Generating pairing code…
            </div>
          )}
        </div>
      </DemoPanel>

      <DemoPanel title="How it works">
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
          WalletConnect is a relay protocol that connects web apps to mobile
          wallets (Hana, Lobstr, Hot Wallet) via a QR code. The flow:
        </p>
        <ol style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
          <li><code>connect('walletconnect')</code> calls <code>SignClient.init()</code></li>
          <li>Generates a pairing URI via <code>client.connect()</code></li>
          <li>Fires <code>onUri(uri)</code> — this demo renders it as a QR code</li>
          <li>The wallet scans the QR, approves the connection</li>
          <li><code>connect()</code> resolves with the wallet&apos;s address</li>
        </ol>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          <strong>Note:</strong> This demo calls <code>connect()</code>{' '}
          <em>directly</em> instead of opening the modal, because the QR code
          needs to be visible on the page. The modal also supports WC QR
          rendering — if you click WalletConnect from the modal&apos;s wallet
          list, the QR appears inside the modal.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          The session topic is persisted in <code>localStorage</code>, so{' '}
          <code>appkit.restore()</code> reconnects automatically on page reload
          (until the session expires, ~7 days by default).
        </p>
      </DemoPanel>
    </div>
  );
}

function SetupPanel() {
  return (
    <DemoPanel title="Setup" full>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
        WalletConnect is not included in the default connector set because it
        requires a <code>projectId</code> from{' '}
        <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>
          WalletConnect Cloud
        </a>{' '}
        (free).
      </p>

      <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        1. Get a project ID
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
        Go to <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>cloud.walletconnect.com</a>,
        create a project, and copy the project ID (a UUID).
      </p>

      <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        2. Add it to your environment
      </div>
      <CodeBlock code={`# .env.local (Next.js)
NEXT_PUBLIC_REOWN_PROJECT_ID=your-project-id-here`} language="bash" />

      <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        3. Create the connector
      </div>
      <CodeBlock code={SETUP_CODE} language="typescript" />
    </DemoPanel>
  );
}

const SETUP_CODE = `import {
  StellarAppKit,
  createWalletConnectConnector,
  defaultConnectors,
  Networks,
} from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  connectors: [
    ...defaultConnectors(), // Freighter, Albedo, xBull, Ledger
    createWalletConnectConnector({
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
      metadata: {
        name: 'My App',
        description: 'A Stellar dApp',
        url: 'https://app.example.com',
        icons: ['https://app.example.com/icon.png'],
      },
      networkPassphrase: Networks.TESTNET,
      // onUri is optional — the modal renders the QR code automatically
      // using better-qr. Only set it if you're building your own UI.
    }),
  ],
  appMetadata: { name: 'Example App' },
});`;
