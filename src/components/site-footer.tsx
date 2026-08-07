export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>
          Built with{' '}
          <a href="https://github.com/sagantaHQ/stellar-appkit" target="_blank" rel="noreferrer">
            Stellar AppKit
          </a>{' '}
          ·{' '}
          <a href="https://nextjs.org" target="_blank" rel="noreferrer">
            Next.js 15
          </a>{' '}
          ·{' '}
          <a href="https://opennext.js.org/cloudflare" target="_blank" rel="noreferrer">
            OpenNext for Cloudflare
          </a>
        </p>
        <p className="site-footer__meta">
          Network: Stellar Testnet · MIT License ·{' '}
          <a href="https://github.com/sagantaHQ/stellar-appkit-demos" target="_blank" rel="noreferrer">
            Source
          </a>
        </p>
      </div>
    </footer>
  );
}
