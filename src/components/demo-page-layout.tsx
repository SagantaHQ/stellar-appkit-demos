import Link from 'next/link';
import { type ReactNode } from 'react';
import { demos, type Demo } from '@/demos/registry';

export function DemoPageLayout({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const demo = demos.find((d) => d.slug === slug);
  if (!demo) {
    return (
      <div className="demo-page">
        <Link href="/" className="demo-page__back">← Back to demos</Link>
        <h1 className="demo-page__title">Demo not found</h1>
      </div>
    );
  }

  return (
    <div className="demo-page">
      <Link href="/" className="demo-page__back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to demos
      </Link>

      <header className="demo-page__header">
        <h1 className="demo-page__title">{demo.title}</h1>
        <p className="demo-page__desc">{demo.description}</p>
        <div className="demo-page__meta">
          <span className={`demo-card__difficulty demo-card__difficulty--${demo.difficulty}`}>
            {demo.difficulty}
          </span>
          {demo.hasServer && (
            <span className="status status--warning">includes server-side code</span>
          )}
          {demo.tags.map((tag) => (
            <span key={tag} className="demo-page__tag">{tag}</span>
          ))}
        </div>
      </header>

      {children}
    </div>
  );
}

export function DemoPanel({
  title,
  children,
  full = false,
}: {
  title: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <section className={`demo-panel${full ? ' demo-panel--full' : ''}`}>
      <div className="demo-panel__header">
        <span>{title}</span>
      </div>
      <div className="demo-panel__body">
        {children}
      </div>
    </section>
  );
}
