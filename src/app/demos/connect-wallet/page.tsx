'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useConnect, useSession } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { openAppKitModal } from '@/components/appkit-provider';

export default function ConnectWalletDemo() {
  return (
    <DemoPageLayout slug="connect-wallet">
      <ConnectDemo />

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code" full>
          <CodeBlock code={CODE} language="typescript" />
        </DemoPanel>
      </div>
    </DemoPageLayout>
  );
}

function ConnectDemo() {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();

  return (
    <div className="demo-page__layout">
      <DemoPanel title="Live demo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            className="btn btn--primary"
            onClick={() => openAppKitModal()}
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
          The <code>&lt;saganta-appkit-modal&gt;</code> Web Component is mounted
          persistently at the provider level — it handles wallet selection,
          connecting state, network mismatch recovery, the connected view
          (balance, history, account switching), and the transaction preview
          (signing confirmation).
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          The button calls <code>openAppKitModal()</code> which queries the
          persistent modal element from the DOM and calls its <code>open()</code>{' '}
          method. Once connected, the same button opens the connected view.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
          When signing a transaction, the modal automatically opens to show the
          transaction preview — decoded operations, risk flags, fee estimate —
          before the wallet's own signature prompt appears.
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
} from '@saganta/stellar-appkit-ui-web/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit-ui-web/react';
import { createFreighterConnector } from '@saganta/stellar-appkit';
import '@saganta/stellar-appkit-ui-web';

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
    <button
      disabled={isConnecting}
      onClick={() => modalRef.current?.open()}
    >
      {isConnecting ? 'Connecting...' : isConnected ? 'Open wallet' : 'Connect wallet'}
    </button>
  );
}`;
