'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  useAppKit,
  useSession,
  useSignIn,
  useSiwsSession,
  useIsAuthenticated,
} from '@saganta/stellar-appkit-ui-web/react';
import type { SiwsSession, SiwsError } from '@saganta/stellar-appkit';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';

export default function SiwsSessionManagementDemo() {
  return (
    <DemoPageLayout slug="siws-session-management">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <SiwsSessionDemo />
        </DemoPanel>
        <DemoPanel title="What this demo shows">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            The v1.7.x release added a complete SIWS session lifecycle to the SDK.
            This demo exercises every piece of it against the live{' '}
            <code>/api/siws/*</code> endpoints:
          </p>
          <ul style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
            <li>
              <code>useSiwsSession()</code> — reactive <code>SiwsSession | null</code>;
              re-renders when the session is set, cleared, or expires.
            </li>
            <li>
              <code>useIsAuthenticated()</code> — reactive <code>boolean</code> derived
              from <code>useSiwsSession()</code>.
            </li>
            <li>
              <code>appkit.setSiwsSession(session)</code> — manually set the SIWS session
              after a successful sign-in. Persists to <code>localStorage</code> so it
              survives page reloads.
            </li>
            <li>
              <code>appkit.signOut()</code> — clears the local session, calls
              <code>signout()</code> on the server, and disconnects the wallet.
            </li>
            <li>
              <code>appkit.validateSession()</code> — calls the server&apos;s
              <code>refresh()</code> (or <code>session()</code>) to validate the
              current session against the server.
            </li>
            <li>
              <code>appkit.requireAuth()</code> — throws <code>ConnectError</code> if
              not authenticated. Use to guard privileged actions.
            </li>
            <li>
              <code>appkit.reauthenticate()</code> — clears the session and triggers
              a fresh SIWS sign-in flow (useful for &quot;Confirm it&apos;s you&quot;
              privilege escalation).
            </li>
            <li>
              <code>appkit.siwsSession</code> — synchronous getter that auto-clears
              expired sessions.
            </li>
          </ul>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Try it:</strong> sign in once, then refresh the page — the session
            should still be there. Then click <em>Validate session</em> to confirm
            with the server, <em>Re-authenticate</em> to clear + re-sign, and
            <em>Sign out</em> to clear everything.
          </p>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code" full>
          <CodeBlock code={CODE} language="typescript" />
        </DemoPanel>
      </div>
    </DemoPageLayout>
  );
}

function SiwsSessionDemo() {
  const appkit = useAppKit();
  const walletSession = useSession();
  const siwsSession = useSiwsSession();
  const isAuthenticated = useIsAuthenticated();
  const { sign, isSigning } = useSignIn();

  const [serverSession, setServerSession] = useState<{ authenticated: boolean; address?: string } | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const log = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setActionLog((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 8));
  }, []);

  // Check existing server session on mount, and on every siwsSession change.
  useEffect(() => {
    fetch('/api/siws/session')
      .then((r) => r.json())
      .then((data) => {
        setServerSession({ authenticated: !!data.authenticated, address: data.address });
      })
      .catch(() => setServerSession({ authenticated: false }));
  }, [siwsSession]);

  const handleSignIn = async () => {
    if (!walletSession) return;
    setActionError(null);
    log('Starting SIWS sign-in…');
    try {
      // 1. Fetch nonce
      const { nonce } = await fetch('/api/siws/nonce').then((r) => r.json());
      log(`Fetched nonce: ${nonce.slice(0, 12)}…`);

      // 2. Sign SIWS message via the SDK's useSignIn hook
      const result = await sign({
        statement: 'Sign in to Stellar AppKit Demos',
        nonce,
      });
      log(`Signed message (${result.signedData?.length ?? 0} bytes base64)`);

      // 3. Verify server-side
      const verifyRes = await fetch('/api/siws/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: result.message,
          signedMessage: result.signedMessage,
          signedData: result.signedData,
          signerAddress: result.signerAddress,
          nonce,
        }),
      });
      const verifyJson: { ok: boolean; address?: string; network?: string; expiry?: number; reason?: string } = await verifyRes.json();

      if (!verifyJson.ok) {
        const msg = verifyJson.reason || 'Verification failed';
        setActionError(msg);
        log(`Verify failed: ${msg}`);
        return;
      }

      // 4. Construct SiwsSession and hand it to the SDK.
      //    setSiwsSession persists to localStorage + emits siwsSessionChange
      //    → useSiwsSession() hook updates across the app.
      const session: SiwsSession = {
        network: (verifyJson.network as SiwsSession['network']) ?? 'TESTNET',
        address: verifyJson.address!,
        expiry: verifyJson.expiry ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
        metadata: { statement: 'Sign in to Stellar AppKit Demos' },
      };
      appkit.setSiwsSession(session);
      log(`Session set — expires ${new Date(session.expiry).toLocaleString()}`);
    } catch (err) {
      const siwsErr = err as SiwsError;
      const msg = siwsErr.type ? `${siwsErr.type}: ${siwsErr.message}` : String(err);
      setActionError(msg);
      log(`Error: ${msg}`);
    }
  };

  const handleSignOut = async () => {
    setActionError(null);
    log('Signing out…');
    try {
      // appkit.signOut() clears the local SIWS session, calls the server's
      // signout endpoint (which clears the cookie), and disconnects the wallet.
      await appkit.signOut();
      log('Signed out — session cleared, wallet disconnected');
      setServerSession({ authenticated: false });
    } catch (err) {
      setActionError(String(err));
      log(`Sign out error: ${String(err)}`);
    }
  };

  const handleValidate = async () => {
    setActionError(null);
    log('Validating session against server…');
    try {
      // validateSession() calls the server (refresh() if configured, else
      // session()) and returns the validated SiwsSession | null. If the
      // session is invalid/expired/mismatched, it clears the local session.
      // For this demo, we manually fetch /api/siws/session and reconcile.
      const res = await fetch('/api/siws/session');
      const data = await res.json() as {
        authenticated?: boolean;
        address?: string;
        network?: string;
        expiry?: number;
      };

      if (!data.authenticated || !data.address) {
        appkit.setSiwsSession(null);
        log('Server says: not authenticated — local session cleared');
        setServerSession({ authenticated: false });
        return;
      }

      // Address mismatch — server has a different user than the local session.
      // Clear the local session.
      if (siwsSession && data.address !== siwsSession.address) {
        appkit.setSiwsSession(null);
        log(`Address mismatch — local session cleared (server: ${data.address.slice(0, 8)}…, local: ${siwsSession.address.slice(0, 8)}…)`);
        return;
      }

      // Update with the fresh server session (in case expiry was extended).
      const fresh: SiwsSession = {
        network: (data.network as SiwsSession['network']) ?? 'TESTNET',
        address: data.address,
        expiry: data.expiry ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      appkit.setSiwsSession(fresh);
      log(`Session valid — server confirmed ${data.address.slice(0, 8)}…`);
      setServerSession({ authenticated: true, address: data.address });
    } catch (err) {
      setActionError(String(err));
      log(`Validate error: ${String(err)}`);
    }
  };

  const handleReauthenticate = async () => {
    setActionError(null);
    log('Re-authenticating (clearing + re-signing)…');
    try {
      // reauthenticate() clears the local session and emits siwsSessionChange
      // so any UI subscribed via useSiwsSession() updates. In a full siwsConfig
      // setup, the modal picks up this event and triggers a fresh sign-in
      // flow automatically. Here we just clear + ask the user to sign again.
      await appkit.reauthenticate();
      log('Session cleared — click "Sign in" to re-authenticate');
    } catch (err) {
      setActionError(String(err));
      log(`Re-auth error: ${String(err)}`);
    }
  };

  const handleRequireAuth = async () => {
    setActionError(null);
    try {
      // requireAuth() throws ConnectError if not authenticated. Use this to
      // guard privileged actions (e.g. before submitting a transaction).
      appkit.requireAuth();
      log(`requireAuth() passed — you are authenticated as ${siwsSession?.address.slice(0, 8)}…`);
    } catch (err) {
      const msg = String(err);
      setActionError(msg);
      log(`requireAuth() threw: ${msg}`);
    }
  };

  if (!walletSession) {
    return (
      <div className="empty-state">
        Connect a wallet first (use the <strong>Connect a Wallet</strong> demo above).
      </div>
    );
  }

  return (
    <div>
      {/* Wallet session */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>Wallet session</div>
        <div className="address">{walletSession.address}</div>
      </div>

      {/* SIWS session (local) — driven by useSiwsSession() */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>
          SIWS session (local — <code>useSiwsSession()</code>)
        </div>
        {siwsSession ? (
          <div className="result-block result-block--success" style={{ marginTop: 0 }}>
            <div><strong>address:</strong> {siwsSession.address}</div>
            <div><strong>network:</strong> {siwsSession.network}</div>
            <div><strong>expiry:</strong> {new Date(siwsSession.expiry).toLocaleString()}</div>
            {siwsSession.metadata && (
              <div><strong>metadata:</strong> {JSON.stringify(siwsSession.metadata)}</div>
            )}
          </div>
        ) : (
          <span className="status">no local session</span>
        )}
      </div>

      {/* Server session (cookie) */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>
          Server session (<code>/api/siws/session</code>)
        </div>
        {serverSession?.authenticated ? (
          <span className="status status--success">
            ✓ authenticated as {serverSession.address?.slice(0, 8)}…
          </span>
        ) : (
          <span className="status">not authenticated</span>
        )}
      </div>

      {/* isAuthenticated flag */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="field__label" style={{ marginBottom: '0.375rem' }}>
          <code>useIsAuthenticated()</code>
        </div>
        <span className={`status ${isAuthenticated ? 'status--success' : ''}`}>
          {isAuthenticated ? 'true' : 'false'}
        </span>
      </div>

      {/* Action buttons */}
      {!siwsSession ? (
        <button
          className="btn btn--primary"
          onClick={handleSignIn}
          disabled={isSigning}
        >
          {isSigning ? 'Sign the SIWS message…' : 'Sign in with Stellar'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={handleValidate}>
            Validate session
          </button>
          <button className="btn" onClick={handleRequireAuth}>
            Call requireAuth()
          </button>
          <button className="btn" onClick={handleReauthenticate}>
            Re-authenticate
          </button>
          <button className="btn btn--danger" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div className="field__label" style={{ marginBottom: '0.375rem' }}>Action log</div>
          <div className="result-block" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            {actionLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {actionError && (
        <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
          {actionError}
        </div>
      )}
    </div>
  );
}

const CODE = `// ---- Client (React) ----
// Demonstrates the v1.7.x SIWS session lifecycle:
//   useSiwsSession, useIsAuthenticated, setSiwsSession, signOut,
//   validateSession, requireAuth, reauthenticate, siwsSession
//
// All methods are available on the StellarAppKit client instance
// (obtained via useAppKit()). The session is persisted to localStorage
// by the SDK and restored automatically on app load.

import {
  useAppKit,
  useSession,
  useSignIn,
  useSiwsSession,
  useIsAuthenticated,
} from '@saganta/stellar-appkit-ui-web/react';
import type { SiwsSession } from '@saganta/stellar-appkit';

function SessionDemo() {
  const appkit = useAppKit();
  const walletSession = useSession();
  const siwsSession = useSiwsSession();          // reactive SiwsSession | null
  const isAuthenticated = useIsAuthenticated();  // reactive boolean
  const { sign } = useSignIn();

  // ---- Sign in: fetch nonce → sign → verify → setSiwsSession ----
  async function handleSignIn() {
    const { nonce } = await fetch('/api/siws/nonce').then(r => r.json());
    const result = await sign({ statement: 'Sign in to My App', nonce });

    const res = await fetch('/api/siws/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: result.message,
        signedMessage: result.signedMessage,
        signedData: result.signedData,
        signerAddress: result.signerAddress,
        nonce,
      }),
    });
    const json = await res.json();
    if (!json.ok) return;

    // Hand the session to the SDK — persists to localStorage + emits
    // siwsSessionChange so useSiwsSession() re-renders app-wide.
    const session: SiwsSession = {
      network: json.network,
      address: json.address,
      expiry: json.expiry,
      metadata: { statement: 'Sign in to My App' },
    };
    appkit.setSiwsSession(session);
  }

  // ---- Sign out: clears local session, calls server signout, disconnects wallet ----
  async function handleSignOut() {
    await appkit.signOut();
  }

  // ---- Validate: re-check session against the server ----
  // Calls refresh() (or session() if no refresh is configured) on the
  // SiwsConfig. If the server says the session is invalid/expired, the
  // local session is cleared.
  async function handleValidate() {
    const session = await appkit.validateSession();
    console.log('Validated session:', session);
  }

  // ---- Guard privileged actions ----
  // Throws ConnectError if not authenticated. Use before sensitive ops.
  function doPrivilegedAction() {
    appkit.requireAuth();  // throws if not authenticated
    // ... proceed with the action ...
  }

  // ---- Re-authenticate: clear + trigger fresh sign-in ----
  // Useful for "Confirm it's you" privilege escalation. In a siwsConfig
  // setup, the modal picks up the siwsSessionChange event and triggers
  // the SIWS flow automatically.
  async function handleReauthenticate() {
    await appkit.reauthenticate();
  }

  // The siwsSession getter auto-clears expired sessions:
  const current = appkit.siwsSession;  // null if expired

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Signed in as {siwsSession.address}</p>
          <button onClick={handleSignOut}>Sign out</button>
        </>
      ) : (
        <button onClick={handleSignIn}>Sign in</button>
      )}
    </div>
  );
}`;
