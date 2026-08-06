import Link from 'next/link';
import { demos, demoCategories, type Demo } from '@/demos/registry';

export default function HomePage() {
  // Group demos by category, preserving the order defined in demoCategories.
  const byCategory = demoCategories.map((cat) => ({
    ...cat,
    demos: demos.filter((d) => d.category === cat.id),
  }));

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero__eyebrow">
          <span className="hero__pill">Live demos</span>
          <span className="hero__pill hero__pill--muted">Testnet</span>
        </div>
        <h1 className="hero__title">
          Stellar AppKit, in action.
        </h1>
        <p className="hero__subtitle">
          Every demo below is a real, working Next.js route — click through to see the
          code, the rendered UI, and the network calls. Copy-paste any of them into
          your own app.
        </p>
        <div className="hero__meta">
          <span>{demos.length} demos</span>
          <span aria-hidden="true">·</span>
          <span>{demos.filter((d) => d.hasServer).length} with server-side code</span>
          <span aria-hidden="true">·</span>
          <span>React + Next.js 15 + Cloudflare</span>
        </div>
      </section>

      {byCategory.map((cat) => (
        <section key={cat.id} className="demo-section">
          <header className="demo-section__header">
            <h2 className="demo-section__title">{cat.label}</h2>
            <p className="demo-section__desc">{cat.description}</p>
          </header>
          <div className="demo-grid">
            {cat.demos.map((demo) => (
              <DemoCard key={demo.slug} demo={demo} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <Link href={`/demos/${demo.slug}`} className="demo-card">
      <div className="demo-card__header">
        <span className={`demo-card__difficulty demo-card__difficulty--${demo.difficulty}`}>
          {demo.difficulty}
        </span>
        {demo.hasServer && (
          <span className="demo-card__server" title="Includes server-side code">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="6" rx="1" />
              <rect x="2" y="15" width="20" height="6" rx="1" />
              <path d="M6 6h.01M6 18h.01" />
            </svg>
            server
          </span>
        )}
      </div>
      <h3 className="demo-card__title">{demo.title}</h3>
      <p className="demo-card__desc">{demo.description}</p>
      <div className="demo-card__tags">
        {demo.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="demo-card__tag">{tag}</span>
        ))}
      </div>
      <div className="demo-card__cta">
        Open demo
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
