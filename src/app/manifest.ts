import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stellar AppKit Demos',
    short_name: 'AppKit Demos',
    description: 'Live demos of @saganta/stellar-appkit — wallet connection, signing, Soroban, SIWS, theming.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0D0E',
    theme_color: '#6EE7B7',
    icons: [],
  };
}
