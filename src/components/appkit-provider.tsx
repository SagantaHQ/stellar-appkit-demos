'use client';

import {
  StellarAppKitProvider,
  useAppKit,
  type StellarAppKitProviderConfig,
} from '@saganta/stellar-appkit-ui-web/react';
import { type ReactNode, useRef, useEffect } from 'react';
import {
  createFreighterConnector,
  createAlbedoConnector,
  createXBullConnector,
} from '@saganta/stellar-appkit';
import type { StellarAppKit } from '@saganta/stellar-appkit';
// Static import — registers the <saganta-appkit-modal> custom element.
import '@saganta/stellar-appkit-ui-web';

const config: StellarAppKitProviderConfig = {
  network: 'TESTNET',
  connectors: [
    createFreighterConnector(),
    createAlbedoConnector(),
    createXBullConnector(),
  ],
  appMetadata: {
    name: 'Stellar AppKit Demos',
    domain: 'demos.stellar-appkit.saganta.com',
    uri: 'https://demos.stellar-appkit.saganta.com',
  },
};

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <StellarAppKitProvider config={config}>
      <PersistentModal />
      {children}
    </StellarAppKitProvider>
  );
}

/**
 * Renders a persistent <saganta-appkit-modal> and sets its client from context.
 * This modal stays mounted for the entire session — it handles:
 * - Wallet selection (when user clicks "Connect wallet" in ConnectGate)
 * - Transaction preview (when user signs — onPreviewTransaction is wired here)
 * - Connected view (balance, history, disconnect)
 *
 * ConnectGate no longer renders its own modal — it opens this persistent one.
 */
function PersistentModal() {
  const client = useAppKit();
  const modalElRef = useRef<HTMLElement & { client: StellarAppKit | null; open?: () => Promise<void> } | null>(null);

  const setModalRef = (el: HTMLElement & { client: StellarAppKit | null; open?: () => Promise<void> } | null) => {
    modalElRef.current = el;
    if (el && !el.client) {
      el.client = client;
    }
  };

  useEffect(() => {
    const el = modalElRef.current;
    if (el && !el.client) {
      el.client = client;
    }
  }, [client]);

  return (
    <saganta-appkit-modal
      ref={setModalRef as never}
      mode="auto"
      theme="dark"
    />
  );
}

/**
 * Helper for ConnectGate and demos to open the persistent modal.
 * Since the modal is mounted at the provider level, we need a way for
 * child components to open it. We use a simple DOM query.
 */
export function openAppKitModal() {
  const el = document.querySelector<HTMLElement & { open?: () => Promise<void> }>('saganta-appkit-modal');
  if (el) {
    el.open?.();
  }
}
