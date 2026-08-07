'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import {
  useConnect,
  useSession,
  useAppKit,
} from '@saganta/stellar-appkit/react';
import type { StellarAppKit } from '@saganta/stellar-appkit';

/**
 * A gate that shows a "Connect wallet" button until the user is connected,
 * then renders the demo content.
 *
 * The modal is rendered as a raw <saganta-appkit-modal> element (not via
 * the <StellarAppKitModal> React wrapper) so we can set the client directly
 * on the DOM element via a callback ref. This avoids the race condition
 * where the forwardRef imperative handle isn't ready before open() is called.
 */
export function ConnectGate({ children }: { children: (session: NonNullable<ReturnType<typeof useSession>>) => ReactNode }) {
  const { isConnected, isConnecting } = useConnect();
  const session = useSession();
  const client = useAppKit();
  const modalElRef = useRef<HTMLElement & { client: StellarAppKit | null; open?: () => Promise<void>; close?: () => void } | null>(null);

  // Set the client on the DOM element as soon as it mounts.
  const setModalRef = (el: HTMLElement & { client: StellarAppKit | null; open?: () => Promise<void>; close?: () => void } | null) => {
    modalElRef.current = el;
    if (el && !el.client) {
      el.client = client;
    }
  };

  // Also set the client whenever it changes (e.g. on hot reload).
  useEffect(() => {
    const el = modalElRef.current;
    if (el && !el.client) {
      el.client = client;
    }
  }, [client]);

  const openModal = async () => {
    const el = modalElRef.current;
    if (!el) return;
    // Ensure the client is set before opening.
    if (!el.client) {
      el.client = client;
    }
    await el.open?.();
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
        {/* Render the modal as a raw custom element. We set the client
            directly on the DOM element via the callback ref to avoid
            race conditions with the forwardRef imperative handle. */}
        <saganta-appkit-modal
          ref={setModalRef as never}
          mode="auto"
          theme="dark"
        />
      </div>
    );
  }

  return <>{children(session)}</>;
}
