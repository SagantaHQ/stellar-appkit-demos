'use client';

import Script from 'next/script';

/**
 * Google Analytics integration via next/script.
 *
 * Uses NEXT_PUBLIC_GA_ID environment variable (set in Cloudflare Pages
 * environment variables). If the env var is not set, the component
 * renders nothing — so the site works without GA in development.
 *
 * Following the Next.js docs:
 * https://nextjs.org/docs/messages/next-script-for-ga
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}
