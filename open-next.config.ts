// OpenNext for Cloudflare — wraps the Next.js build so it runs on Cloudflare's
// Workers runtime. Produces a .open-next/ directory with worker.js + assets.
//
// Docs: https://opennext.js.org/cloudflare

import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const config = defineCloudflareConfig({});

// Explicitly set the build command to `next build` (not `npm run build`).
// This prevents infinite recursion when the `build` npm script is set to
// `opennextjs-cloudflare build` — without this, OpenNext would call
// `npm run build` → `opennextjs-cloudflare build` → `npm run build` → forever.
(config as Record<string, unknown>).buildCommand = 'next build';

// Externalize heavy packages so they're not bundled into the Worker.
// The Cloudflare Workers free plan has a 3 MiB size limit — without
// these externals, the Worker bundle is ~19 MiB (mostly @stellar/stellar-sdk
// and wallet SDKs). These packages are lazy-imported at runtime via
// dynamic import(), so they don't need to be in the initial bundle.
//
// Note: defineCloudflareConfig() already sets edgeExternals: ["node:crypto"].
// We merge our extras in rather than replacing the array — otherwise
// ensureCloudflareConfig() fails validation because node:crypto is missing.
const existingExternals = (config as Record<string, unknown>).edgeExternals as string[] ?? [];
(config as Record<string, unknown>).edgeExternals = [
  ...existingExternals,
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
];

export default config;
