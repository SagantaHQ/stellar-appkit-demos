import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

const SITE_URL = 'https://demos.stellar-appkit.saganta.com';
const DESCRIPTION = 'Live, copy-pasteable demos of @saganta/stellar-appkit — 14 working examples of Stellar wallet connection, transaction signing, Soroban contract calls, SIWS authentication, and theming. Built with Next.js 15 + OpenNext for Cloudflare.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Stellar AppKit Demos — Live wallet, signing, Soroban & SIWS examples',
    template: '%s · Stellar AppKit Demos',
  },
  description: DESCRIPTION,
  keywords: [
    'Stellar', 'Soroban', 'wallet', 'Web3Modal', 'AppKit', 'Freighter',
    'Albedo', 'xBull', 'Ledger', 'WalletConnect', 'SIWS', 'Sign-In With Stellar',
    'SEP-43', 'SEP-0053', 'React', 'Next.js', 'Cloudflare', 'TypeScript',
    'blockchain', 'crypto', 'dApp', 'smart contract', 'transaction preview',
  ],
  authors: [{ name: 'Saganta', url: 'https://github.com/SagantaHQ' }],
  creator: 'Saganta',
  publisher: 'Saganta',
  applicationName: 'Stellar AppKit Demos',
  category: 'Developer Tools',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Stellar AppKit Demos',
    title: 'Stellar AppKit Demos — Live wallet, signing, Soroban & SIWS examples',
    description: DESCRIPTION,
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Stellar AppKit Demos — 14 live examples',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stellar AppKit Demos',
    description: DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@saganta',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Allow AI bots to index the content
  other: {
    'ai-bot': 'allow',
    'llm-indexing': 'allowed',
    'content-license': 'MIT',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* JSON-LD: WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Stellar AppKit Demos',
              description: DESCRIPTION,
              url: SITE_URL,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web',
              author: {
                '@type': 'Organization',
                name: 'Saganta',
                url: 'https://github.com/SagantaHQ',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Saganta',
                url: 'https://github.com/SagantaHQ',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              license: 'https://github.com/SagantaHQ/stellar-appkit/blob/main/LICENSE',
              isPartOf: {
                '@type': 'SoftwareApplication',
                name: 'Stellar AppKit',
                url: 'https://stellar-appkit.saganta.com',
              },
              codeRepository: 'https://github.com/SagantaHQ/stellar-appkit-demos',
            }),
          }}
        />
        {/* JSON-LD: BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Stellar AppKit',
                  item: 'https://stellar-appkit.saganta.com',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Demos',
                  item: SITE_URL,
                },
              ],
            }),
          }}
        />
        {/* JSON-LD: FAQPage for AI search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is Stellar AppKit?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Stellar AppKit is a Web3Modal/Reown AppKit equivalent for Stellar. It provides a unified wallet API, a first-class Soroban layer, real transaction previews, and a themeable UI that works in React, Vue, Solid, and Svelte.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Which Stellar wallets are supported?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Freighter, Albedo, xBull, Ledger, and WalletConnect (Lobstr, Hana, Hot Wallet) are all supported through the unified SEP-43 connector interface.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does Stellar AppKit support Soroban smart contracts?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes — a single invoke() call covers build → simulate → prepare → sign → submit → poll. Typed contract clients, RPC failover, contract verification badges, and pre-simulate fee estimation are built in.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What is Sign-In With Stellar (SIWS)?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'SIWS is a self-issued, SEP-43-based message-signing flow analogous to Sign-In With Ethereum. The user signs a message with their wallet, and the server verifies the signature using @saganta/stellar-appkit-siws-verify.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
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
