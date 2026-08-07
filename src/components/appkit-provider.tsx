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
// Static import — registers the <saganta-appkit-modal> custom element.
// This is safe because this component is 'use client' and all demo pages
// have `export const dynamic = 'force-dynamic'` — the module is never
// evaluated during SSR. The customElements.define() call at the bottom
// of connect-modal.js is guarded by `typeof customElements !== 'undefined'`.
import '@saganta/stellar-appkit/ui-web';

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
  // The ui-web module is imported statically above — the custom element
  // is registered as soon as this module loads in the browser.
  // No useEffect needed for registration.
  useEffect(() => {
    // Just trigger a restore on mount.
  }, []);

  return <StellarAppKitProvider config={config}>{children}</StellarAppKitProvider>;
}
