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
    '@trezor/connect-web',
    '@trezor/connect-plugin-stellar',
    '@trezor/utils',
    '@hot-wallet/sdk',
  ],
  // Ignore Trezor packages that aren't used in the demos — prevents
  // webpack from trying to resolve their broken export paths.
  webpack: (config) => {
    // Mark Trezor packages as empty modules — they're never used in the demos
    config.resolve.alias = {
      ...config.resolve.alias,
      '@trezor/connect-web': false,
      '@trezor/connect-plugin-stellar': false,
      '@trezor/utils': false,
    };
    return config;
  },
};

export default nextConfig;
