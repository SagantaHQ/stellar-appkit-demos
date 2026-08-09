'use client';

import { type ReactNode } from 'react';
import { useConnect, useSession } from '@saganta/stellar-appkit-ui-web/react';
import { openAppKitModal } from '@/components/appkit-provider';

/**
 * A gate that shows a "Connect wallet" button until the user is connected,
 * then renders the demo content.
 *
 * The modal is mounted persistently at the AppKitProvider level (not inside
 * this gate) — so it stays in the DOM even after connecting. This ensures
 * the transaction preview UI (onPreviewTransaction) is always wired up.
 */
export function ConnectGate({ children }: { children: (session: NonNullable<ReturnType<typeof useSession>>) => ReactNode }) {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();

  if (!isConnected || !session) {
    return (
      <div className="connect-gate">
        <div className="connect-gate__icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M2 10h20M6 14h4" />
          </svg>
        </div>
        <h3 className="connect-gate__title">Connect a wallet to start</h3>
        <p className="connect-gate__desc">
          This demo requires a connected Stellar wallet. Click below to open the
          wallet picker — Freighter, Albedo, or xBull on Testnet.
        </p>
        <button
          className="btn btn--primary"
          onClick={() => openAppKitModal()}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect wallet'}
        </button>
      </div>
    );
  }

  return <>{children(session)}</>;
}
