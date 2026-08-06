import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-container" style={{ textAlign: 'center' }}>
      <div className="hero__eyebrow" style={{ marginBottom: '1rem' }}>
        <span className="hero__pill">404</span>
      </div>
      <h1 className="hero__title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
        Page not found
      </h1>
      <p className="hero__subtitle" style={{ margin: '0 auto 1.5rem' }}>
        The demo you're looking for doesn't exist. Check the homepage for the full list.
      </p>
      <Link href="/" className="btn btn--primary">
        ← Back to demos
      </Link>
    </div>
  );
}
