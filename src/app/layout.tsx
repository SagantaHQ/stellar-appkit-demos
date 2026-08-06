import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stellar AppKit Examples',
  description:
    'Live, copy-pasteable demos of @saganta/stellar-appkit — wallet connection, transaction signing, Soroban contract calls, and Sign-In With Stellar. Built with Next.js and deployed on Cloudflare.',
  keywords: [
    'Stellar', 'Soroban', 'wallet', 'Web3Modal', 'AppKit', 'Freighter',
    'Albedo', 'xBull', 'Ledger', 'WalletConnect', 'SIWS', 'Next.js',
  ],
  authors: [{ name: 'Saganta' }],
  openGraph: {
    type: 'website',
    siteName: 'Stellar AppKit Examples',
    title: 'Stellar AppKit Examples',
    description: 'Live, copy-pasteable demos of @saganta/stellar-appkit.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stellar AppKit Examples',
    description: 'Live, copy-pasteable demos of @saganta/stellar-appkit.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-shell">
            <SiteHeader />
            <main className="app-main">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
