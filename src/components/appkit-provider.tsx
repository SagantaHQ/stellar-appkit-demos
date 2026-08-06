'use client';

import {
  StellarAppKitProvider,
  type StellarAppKitProviderConfig,
} from '@saganta/stellar-appkit/react';
import { type ReactNode, useEffect } from 'react';
import {
  createFreighterConnector,
  createAlbedoConnector,
  createXBullConnector,
} from '@saganta/stellar-appkit';

const config: StellarAppKitProviderConfig = {
  network: 'TESTNET',
  connectors: [
    createFreighterConnector(),
    createAlbedoConnector(),
    createXBullConnector(),
  ],
  appMetadata: {
    name: 'Stellar AppKit Examples',
    domain: 'stellar-appkit-examples.saganta.com',
    uri: 'https://stellar-appkit-examples.saganta.com',
  },
};

export function AppKitProvider({ children }: { children: ReactNode }) {
  // Register the <saganta-appkit-modal> custom element on the client only.
  // The Web Component class extends HTMLElement, which is undefined during
  // SSR / build-time prerender — importing it at module top-level would
  // crash Next.js's static generation. This effect runs only in the browser.
  useEffect(() => {
    import('@saganta/stellar-appkit/ui-web');
  }, []);

  return <StellarAppKitProvider config={config}>{children}</StellarAppKitProvider>;
}
