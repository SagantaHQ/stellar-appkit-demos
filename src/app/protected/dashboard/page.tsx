import { cookies } from 'next/headers';

const SESSION_COOKIE = 'sak_session';

/**
 * A server-rendered page that's gated by the SIWS session via middleware.
 *
 * The middleware already verified the cookie exists and parses — so by the
 * time we get here, the user is authenticated. We just read the address
 * from the cookie to personalize the page.
 */
export default async function ProtectedDashboard() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);

  let address = 'unknown';
  if (cookie?.value) {
    try {
      const session = JSON.parse(cookie.value) as { address: string };
      address = session.address;
    } catch {
      // ignore — middleware should have caught this
    }
  }

  return (
    <div className="page-container" style={{ textAlign: 'center' }}>
      <div className="hero__eyebrow" style={{ marginBottom: '1rem' }}>
        <span className="hero__pill">Protected route</span>
      </div>
      <h1 className="hero__title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
        Welcome back.
      </h1>
      <p className="hero__subtitle" style={{ margin: '0 auto 1.5rem' }}>
        You're seeing this page because your SIWS session cookie is valid.
        Try deleting the <code>sak_session</code> cookie in DevTools and
        refreshing — the middleware will redirect you to sign in again.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="field__label">Authenticated as:</span>
        <span className="address">{address}</span>
      </div>
    </div>
  );
}
