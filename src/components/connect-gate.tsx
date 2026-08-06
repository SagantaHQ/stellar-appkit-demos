'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import {
  StellarAppKitModal,
  useConnect,
  useSession,
  useAppKit,
} from '@saganta/stellar-appkit/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/react';

/**
 * A gate that shows a "Connect wallet" button until the user is connected,
 * then renders the demo content. This is the UX pattern for demos that
 * require a connected wallet — instead of showing an empty state that says
 * "Connect a wallet first", the user sees a prominent connect button
 * right in the demo panel.
 *
 * Usage:
 *   <ConnectGate>
 *     {(session) => <MyDemo session={session} />}
 *   </ConnectGate>
 *
 * The modal is mounted inside the gate (hidden), so there's no need for
 * the demo itself to mount a <StellarAppKitModal>.
 */
export function ConnectGate({ children }: { children: (session: NonNullable<ReturnType<typeof useSession>>) => ReactNode }) {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  const client = useAppKit();
  const modalRef = useRef<StellarAppKitModalHandle>(null);
  const [modalReady, setModalReady] = useState(false);

  // Ensure the modal's client is set as soon as the host element mounts.
  // This is a workaround for the race condition where open() is called
  // before the useEffect that sets el.client runs.
  useEffect(() => {
    if (!modalReady) return;
    const el = modalRef.current?.element;
    if (el && !el.client) {
      el.client = client;
    }
  }, [modalReady, client]);

  const openModal = async () => {
    const handle = modalRef.current;
    if (!handle) return;
    // Ensure client is set before opening — workaround for the race condition
    const el = handle.element;
    if (el && !el.client) {
      el.client = client;
    }
    await handle.open();
  };

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
          onClick={openModal}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect wallet'}
        </button>
        <StellarAppKitModal
          ref={(h) => {
            modalRef.current = h;
            setModalReady(!!h);
          }}
          mode="auto"
          theme="dark"
        />
      </div>
    );
  }

  return <>{children(session)}</>;
}
