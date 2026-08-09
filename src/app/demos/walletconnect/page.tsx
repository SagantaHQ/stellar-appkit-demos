'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useConnect, useSession } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { openAppKitModal } from '@/components/appkit-provider';
import { isWalletConnectEnabled } from '@/components/appkit-provider';

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
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Click <strong>Open wallet</strong> below to disconnect, switch wallets, or view your balance + transaction history.
            </div>
          </div>
        </DemoPanel>
      </div>
    );
  }

  // --- Idle / connecting state ---
  return (
    <div className="demo-page__layout">
      <DemoPanel title="Live demo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <button
              className="btn btn--primary"
              onClick={() => openAppKitModal()}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect wallet'}
            </button>
          </div>

          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            Click <strong>Connect wallet</strong> to open the modal, then pick{' '}
            <strong>WalletConnect</strong> from the wallet list. The modal renders
            the QR code automatically — no extra code needed.
          </div>
        </div>
      </DemoPanel>

      <DemoPanel title="How it works">
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
          WalletConnect is a relay protocol that connects web apps to mobile
          wallets (Hana, Lobstr, Hot Wallet) via a QR code. The flow:
        </p>
        <ol style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
          <li>User clicks <strong>Connect wallet</strong> → modal opens</li>
          <li>User picks <strong>WalletConnect</strong> from the wallet list</li>
          <li>Modal calls <code>connect('walletconnect')</code> internally</li>
          <li>Connector generates a pairing URI via <code>SignClient.connect()</code></li>
          <li>Modal renders the QR code automatically (using <code>better-qr</code>)</li>
          <li>User scans the QR with Hana/Lobstr/Hot Wallet and approves</li>
          <li><code>connect()</code> resolves with the wallet&apos;s address</li>
        </ol>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          <strong>You never call <code>connect('walletconnect')</code> directly.</strong>{' '}
          The modal handles the entire flow — you just register the WalletConnect
          connector in your <code>StellarAppKit</code> config, and it appears in
          the modal&apos;s wallet list alongside Freighter, Albedo, xBull, and Ledger.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          The QR code is rendered inside the modal as an inline SVG (no external
          QR library needed). The modal also shows a deep-link button for mobile
          users and a <strong>Copy URI</strong> button with &quot;Copied!&quot; feedback.
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
        3. Register the connector — the modal handles the rest
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
import '@saganta/stellar-appkit-ui-web';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  connectors: [
    ...defaultConnectors(), // Freighter, Albedo, xBull, Ledger
    createWalletConnectConnector({
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
      networkPassphrase: Networks.TESTNET,
      // metadata is OPTIONAL — inherits from appMetadata automatically.
      // Only pass it if you want a DIFFERENT name/icon for the WC session
      // proposal than what appears in SIWS messages.
      // onUri is also OPTIONAL — the modal renders the QR automatically.
    }),
  ],
  appMetadata: {
    name: 'My App',
    url: 'https://app.example.com',
    description: 'A Stellar dApp',
    icons: ['https://app.example.com/icon.png'],
  },
});

// The modal picks up WalletConnect from the connector list.
// When the user clicks "WalletConnect" in the wallet picker,
// the modal calls connect('walletconnect') and renders the QR code.
const modal = document.querySelector('stellar-appkit-modal');
modal.client = appkit;
modal.open();`;
