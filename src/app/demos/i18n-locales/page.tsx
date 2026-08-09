'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import {
  useLocale,
  useSetLocale,
} from '@saganta/stellar-appkit-ui-web/react';
import type { LocaleCode } from '@saganta/stellar-appkit';
import { openAppKitModal } from '@/components/appkit-provider';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';

const LOCALES: { code: LocaleCode; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'zh-CN', native: '简体中文' },
  { code: 'zh-TW', native: '繁體中文' },
  { code: 'es', native: 'Español' },
  { code: 'pt-BR', native: 'Português (Brasil)' },
  { code: 'ja', native: '日本語' },
  { code: 'ko', native: '한국어' },
  { code: 'de', native: 'Deutsch' },
  { code: 'fr', native: 'Français' },
  { code: 'ru', native: 'Русский' },
  { code: 'ar', native: 'العربية' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'it', native: 'Italiano' },
  { code: 'tr', native: 'Türkçe' },
  { code: 'pl', native: 'Polski' },
  { code: 'vi', native: 'Tiếng Việt' },
  { code: 'id', native: 'Bahasa Indonesia' },
  { code: 'uk', native: 'Українська' },
  { code: 'nl', native: 'Nederlands' },
  { code: 'th', native: 'ไทย' },
  { code: 'he', native: 'עברית' },
  { code: 'cs', native: 'Čeština' },
  { code: 'sv', native: 'Svenska' },
  { code: 'ro', native: 'Română' },
  { code: 'fa', native: 'فارسی' },
];

export default function I18nDemo() {
  return (
    <DemoPageLayout slug="i18n-locales">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <I18nDemoInner />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Stellar AppKit ships with 25 built-in locales. English is bundled
            by default; the other 24 are lazy-loaded via dynamic{' '}
            <code>import()</code> on first use — so the initial bundle stays
            small and only the locale the user picks is downloaded.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Try it:</strong> pick a language below, then click{' '}
            <strong>Open modal</strong> to see the modal UI translated in
            real-time. Every button label, status message, error string, and
            ARIA label updates instantly — no page reload needed.
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

function I18nDemoInner() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const [loadingLocale, setLoadingLocale] = useState<LocaleCode | null>(null);

  const handleLocaleChange = async (code: LocaleCode) => {
    if (code === locale) return;
    setLoadingLocale(code);
    try {
      await setLocale(code);
    } finally {
      setLoadingLocale(null);
    }
  };

  return (
    <ConnectGate>
      {(session) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div className="field__label" style={{ marginBottom: '0.5rem' }}>Current locale</div>
            <div className="address" style={{ display: 'inline-block' }}>
              <code>{locale}</code> — {LOCALES.find((l) => l.code === locale)?.native ?? locale}
            </div>
          </div>
          <div>
            <div className="field__label" style={{ marginBottom: '0.5rem' }}>Switch locale (lazy-loaded on first use)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', padding: '0.25rem' }}>
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLocaleChange(l.code)}
                  disabled={loadingLocale !== null}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.125rem',
                    padding: '0.5rem 0.75rem', borderRadius: '8px',
                    border: locale === l.code ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: locale === l.code ? 'rgba(110, 231, 183, 0.1)' : 'transparent',
                    color: 'var(--color-text)', cursor: loadingLocale !== null ? 'wait' : 'pointer',
                    textAlign: 'left', fontSize: '0.8125rem',
                    opacity: loadingLocale !== null && loadingLocale !== l.code ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{l.native}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                    {l.code}{loadingLocale === l.code ? ' · loading…' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <button className="btn btn--primary" onClick={() => openAppKitModal()}>
              Open modal
            </button>
            <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Connected as {session.address.slice(0, 8)}…
            </span>
          </div>
          <div className="result-block" style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>What to look for in the modal:</div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              <li>Panel title, wallet status labels, footer, ARIA labels all translated</li>
              <li>For RTL locales (ar, he, fa): text is translated naturally</li>
            </ul>
          </div>
        </div>
      )}
    </ConnectGate>
  );
}

const CODE = `// Set at initialization
new StellarAppKit({ locale: 'zh-CN', ... });

// Change at runtime (async — lazy-loads)
import { setLocale, getLocale, t } from '@saganta/stellar-appkit';
await setLocale('ja');
t('title.connect_wallet'); // → 'ウォレットを接続'

// React hooks
import { useLocale, useSetLocale } from '@saganta/stellar-appkit-ui-web/react';
const locale = useLocale();
const setLocale = useSetLocale();`;
