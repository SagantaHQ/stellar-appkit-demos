import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile the @saganta packages so they work with Next's bundler.
  transpilePackages: ['@saganta/stellar-appkit', '@saganta/stellar-appkit-siws-verify'],
};

export default nextConfig;
