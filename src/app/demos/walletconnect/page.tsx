'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useConnect, useSession } from '@saganta/stellar-appkit-ui-web/react';
import { QRCodeSVG } from 'qrcode.react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';
import {
  openAppKitModal,
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
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [isConnectingWC, setIsConnectingWC] = useState(false);

  // Subscribe to WalletConnect pairing URIs from the connector
  useEffect(() => {
    setWalletConnectUriListener((uri) => {
      setWcUri(uri);
      if (uri) {
        setIsConnectingWC(true);
      } else {
        setIsConnectingWC(false);
      }
    });
    return () => {
      setWalletConnectUriListener(null);
      setWcUri(null);
      setIsConnectingWC(false);
    };
  }, []);

  // Clear the URI once connected (the QR is no longer needed)
  useEffect(() => {
    if (isConnected && wcUri) {
      setWcUri(null);
      setIsConnectingWC(false);
    }
  }, [isConnected, wcUri]);

  const handleConnect = async () => {
    setWcUri(null);
    setIsConnectingWC(true);
    openAppKitModal();
  };

  return (
    <ConnectGate>
      {(session) => (
    <div className="demo-page__layout">
      <DemoPanel title="Live demo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn--primary"
              onClick={handleConnect}
              disabled={isConnecting || isConnectingWC}
            >
              {isConnecting || isConnectingWC
                ? 'Connecting...'
                : isConnected
                  ? 'Open wallet'
                  : 'Connect WalletConnect'}
            </button>
            {isConnected && <span className="status status--success">connected</span>}
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
                <QRCodeSVG value={wcUri} size={220} />
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

          {/* Connected state */}
          {isConnected && session ? (
            <div>
              <div className="field__label" style={{ marginBottom: '0.375rem' }}>Connected address</div>
              <div className="address">{session.address}</div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Wallet: <code>{session.walletId}</code> · Network: <code>{session.network}</code>
              </div>
            </div>
          ) : (
            !wcUri && (
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
            )
          )}
        </div>
      </DemoPanel>

      <DemoPanel title="How it works">
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
          WalletConnect is a relay protocol that connects web apps to mobile
          wallets (Hana, Lobstr, Hot Wallet) via a QR code. The connector:
        </p>
        <ol style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
          <li>Calls <code>SignClient.init()</code> with your project ID</li>
          <li>Generates a pairing URI via <code>client.connect()</code></li>
          <li>Fires <code>onUri(uri)</code> — your app renders it as a QR code</li>
          <li>The wallet scans the QR, approves the connection</li>
          <li><code>connect()</code> resolves with the wallet&apos;s address</li>
        </ol>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          The session topic is persisted in <code>localStorage</code>, so{' '}
          <code>appkit.restore()</code> reconnects automatically on page reload
          (until the session expires, ~7 days by default).
        </p>
      </DemoPanel>
    </div>
      )}
    </ConnectGate>
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
} from '@saganta/stellar-appkit';
import { Networks } from '@stellar/stellar-sdk';

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
      onUri: (uri) => {
        // Render the URI as a QR code (desktop) or deep link (mobile).
        // Use a library like qrcode.react:
        //   <QRCodeSVG value={uri} size={256} />
        setQrUri(uri);
      },
      networkPassphrase: Networks.TESTNET,
    }),
  ],
  appMetadata: { name: 'Example App' },
});`;
