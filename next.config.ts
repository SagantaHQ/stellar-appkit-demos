import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the @saganta packages so they work with Next's bundler.
  transpilePackages: ['@saganta/stellar-appkit', '@saganta/stellar-appkit-siws-verify'],
  // The stellar-appkit modal uses `crypto` (Node builtin) for the SEP-0053 hash
  // in the Freighter connector — this needs to be polyfilled on Cloudflare Workers.
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
