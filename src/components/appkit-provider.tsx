'use client';

import {
  StellarAppKitProvider,
  useAppKit,
  type StellarAppKitProviderConfig,
} from '@saganta/stellar-appkit-ui-web/react';
import { type ReactNode, useRef, useEffect, useMemo } from 'react';
import {
  createFreighterConnector,
  createAlbedoConnector,
  createXBullConnector,
  createLedgerConnector,
  createWalletConnectConnector,
  type WalletConnector,
} from '@saganta/stellar-appkit';
import type { StellarAppKit } from '@saganta/stellar-appkit';
// Static import — registers the <stellar-appkit-modal> custom element.
import '@saganta/stellar-appkit-ui-web';
import { Networks } from '@stellar/stellar-sdk';

/**
 * WalletConnect project ID from Cloudflare env (NEXT_PUBLIC_REOWN_PROJECT_ID).
 *
 * Get one at https://cloud.walletconnect.com/ — it's free. When set, the
 * WalletConnect connector is added to the registry so Hana, Lobstr, and Hot
 * Wallet can connect via QR pairing. When unset, WalletConnect is silently
 * omitted (the other connectors still work).
 *
 * In local dev, create a .env.local file with:
 *   NEXT_PUBLIC_REOWN_PROJECT_ID=your-project-id-here
 */
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

/**
 * A module-level callback that the WalletConnect connector calls with the
 * pairing URI. The WalletConnect demo page subscribes to this so it can
 * render the QR code. Other demos that don't care about WC just ignore it.
 *
 * We use this indirection because the connector is created once at module
 * load time (before any demo page mounts), but the QR code UI is per-page.
 */
type UriListener = (uri: string | null) => void;
let uriListener: UriListener | null = null;

export function setWalletConnectUriListener(fn: UriListener | null) {
  uriListener = fn;
}

/** Returns true if the WalletConnect connector is registered (env var set). */
export function isWalletConnectEnabled(): boolean {
  return !!WC_PROJECT_ID;
}

function buildConnectors(): WalletConnector[] {
  // Start with the default browser-side wallets.
  // Once v1.0.6+ is published, this can be replaced with `defaultConnectors()`.
  const connectors: WalletConnector[] = [
    createFreighterConnector(),
    createAlbedoConnector(),
    createXBullConnector(),
    createLedgerConnector(),
  ];

  // Add WalletConnect if the project ID is configured
  if (WC_PROJECT_ID) {
    connectors.push(
      createWalletConnectConnector({
        projectId: WC_PROJECT_ID,
        metadata: {
          name: 'Stellar AppKit Demos',
          description: 'Live demos of @saganta/stellar-appkit — wallet connection, signing, Soroban, SIWS',
          url: 'https://demos.stellar-appkit.saganta.com',
          icons: ['https://demos.stellar-appkit.saganta.com/icon.png'],
        },
        onUri: (uri) => {
          // Forward the URI to whatever listener is currently registered
          // (the WalletConnect demo page sets this when it mounts)
          if (uriListener) uriListener(uri);
        },
        networkPassphrase: Networks.TESTNET,
      }),
    );
  }

  return connectors;
}

function useConfig(): StellarAppKitProviderConfig {
  return useMemo(() => ({
    network: 'TESTNET',
    connectors: buildConnectors(),
    appMetadata: {
      name: 'Stellar AppKit Demos',
    },
  }), []);
}

export function AppKitProvider({ children }: { children: ReactNode }) {
  const config = useConfig();
  return (
    <StellarAppKitProvider config={config}>
      <PersistentModal />
      {children}
    </StellarAppKitProvider>
  );
}

/**
 * Renders a persistent <stellar-appkit-modal> and sets its client from context.
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
    <stellar-appkit-modal
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
  const el = document.querySelector<HTMLElement & { open?: () => Promise<void> }>('stellar-appkit-modal');
  if (el) {
    el.open?.();
  }
}
