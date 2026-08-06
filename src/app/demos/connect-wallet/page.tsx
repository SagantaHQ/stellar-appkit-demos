'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useRef } from 'react';
import {
  StellarAppKitModal,
  useConnect,
  useSession,
  useAppKit,
} from '@saganta/stellar-appkit/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';

export default function ConnectWalletDemo() {
  const modalRef = useRef<StellarAppKitModalHandle>(null);

  return (
    <DemoPageLayout slug="connect-wallet">
      <ConnectDemo modalRef={modalRef} />

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code" full>
          <pre>{CODE}</pre>
        </DemoPanel>
      </div>

      {/* The modal — mounted once, opened via the imperative ref */}
      <StellarAppKitModal ref={modalRef} mode="auto" theme="dark" />
    </DemoPageLayout>
  );
}

function ConnectDemo({ modalRef }: { modalRef: React.RefObject<StellarAppKitModalHandle | null> }) {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  const client = useAppKit();

  // Ensure the modal's client is set before opening. This is a workaround
  // for a race condition where open() is called before the useEffect that
  // sets el.client runs. Fixed in the library v0.2.1+, but we keep the
  // guard here for backwards compatibility with older published versions.
  const openModal = async () => {
    const handle = modalRef.current;
    if (!handle) return;
    const el = handle.element;
    if (el && !el.client) {
      el.client = client;
    }
    await handle.open();
  };

  return (
    <div className="demo-page__layout">
      <DemoPanel title="Live demo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            className="btn btn--primary"
            onClick={openModal}
            disabled={isConnecting}
          >
            {isConnecting
              ? 'Connecting...'
              : isConnected
                ? 'Open wallet'
                : 'Connect wallet'}
          </button>
          {isConnected && <span className="status status--success">connected</span>}
        </div>

        {isConnected && session ? (
          <div>
            <div className="field__label" style={{ marginBottom: '0.375rem' }}>Connected address</div>
            <div className="address">{session.address}</div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Wallet: <code>{session.walletId}</code> · Network: <code>{session.network}</code>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M2 10h20M6 14h4" />
              </svg>
            </div>
            Click <strong>Connect wallet</strong> to start.
          </div>
        )}
      </DemoPanel>

      <DemoPanel title="How it works">
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
          This is the minimal wallet-connect flow. The{' '}
          <code>&lt;StellarAppKitModal&gt;</code> component is mounted once
          inside the provider — it handles wallet selection, connecting state,
          network mismatch recovery, and the connected view (balance,
          history, account switching).
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          The button calls <code>modalRef.current?.open()</code> — the
          imperative handle exposes <code>open()</code>, <code>close()</code>,
          and <code>element</code> (the underlying DOM node).
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          Once connected, the same button opens the connected view where the
          user can see their balance, transaction history, and disconnect.
        </p>
      </DemoPanel>
    </div>
  );
}

const CODE = `import { useRef } from 'react';
import {
  StellarAppKitProvider,
  StellarAppKitModal,
  useConnect,
  useSession,
} from '@saganta/stellar-appkit/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/react';
import { createFreighterConnector } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit/ui-web';

export function App() {
  return (
    <StellarAppKitProvider config={{
      network: 'TESTNET',
      connectors: [createFreighterConnector()],
      appMetadata: { name: 'My App', domain: 'app.example.com', uri: 'https://app.example.com' },
    }}>
      <WalletButton />
      <StellarAppKitModal mode="auto" theme="dark" />
    </StellarAppKitProvider>
  );
}

function WalletButton() {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  const modalRef = useRef<StellarAppKitModalHandle>(null);

  return (
    <>
      <button
        disabled={isConnecting}
        onClick={() => modalRef.current?.open()}
      >
        {isConnecting ? 'Connecting...' : isConnected ? 'Open wallet' : 'Connect wallet'}
      </button>
      {isConnected && session && (
        <p>Connected: {session.address}</p>
      )}
    </>
  );
}`;
