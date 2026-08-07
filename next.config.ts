import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the @saganta packages so they work with Next's bundler.
  transpilePackages: ['@saganta/stellar-appkit', '@saganta/stellar-appkit-siws-verify', '@saganta/stellar-appkit-ui-web'],
  // Externalize heavy packages so they're not bundled into the Worker.
  // These are lazy-imported at runtime via dynamic import() — they don't
  // need to be in the initial Worker bundle.
  serverExternalPackages: [
    '@stellar/stellar-sdk',
    '@stellar/freighter-api',
    '@albedo-link/intent',
    '@creit.tech/xbull-wallet-connect',
    '@ledgerhq/hw-app-str',
    '@ledgerhq/hw-transport-webhid',
    '@ledgerhq/hw-transport-webusb',
    '@walletconnect/sign-client',
    '@use-gesture/vanilla',
    'motion',
  ],
};

export default nextConfig;
