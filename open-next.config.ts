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
// By setting buildCommand to `next build`, OpenNext calls `next build`
// directly, and the `build` npm script can safely be `opennextjs-cloudflare build`.
(config as Record<string, unknown>).buildCommand = 'next build';

export default config;
