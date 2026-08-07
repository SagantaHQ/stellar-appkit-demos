'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useRef, useState } from 'react';
import { useConnect, useAppKit } from '@saganta/stellar-appkit/react';
import type { StellarAppKit } from '@saganta/stellar-appkit';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';

interface ThemeState {
  bg: string;
  surface: string;
  accent: string;
  text: string;
  textMuted: string;
  radiusLg: string;
  fontDisplay: string;
}

const DEFAULT_THEME: ThemeState = {
  bg: '#0B0D0E',
  surface: '#14171A',
  accent: '#6EE7B7',
  text: '#F5F6F7',
  textMuted: '#9aa0a6',
  radiusLg: '20px',
  fontDisplay: 'ui-sans-serif, system-ui, sans-serif',
};

const PRESETS: Record<string, ThemeState> = {
  'Editorial dark': DEFAULT_THEME,
  'Ocean': { ...DEFAULT_THEME, accent: '#60a5fa', bg: '#0c1322', surface: '#131c2e' },
  'Sunset': { ...DEFAULT_THEME, accent: '#fbbf24', bg: '#1a0f0a', surface: '#241510' },
  'Cyberpunk': { ...DEFAULT_THEME, accent: '#f0abfc', bg: '#0a0014', surface: '#15001f', radiusLg: '4px' },
  'Light': { ...DEFAULT_THEME, bg: '#FAFAFA', surface: '#FFFFFF', accent: '#0F7C5A', text: '#0B0D0E', textMuted: '#5f6368' },
};

export default function ThemingShowcaseDemo() {
  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
  const client = useAppKit();
  const modalElRef = useRef<HTMLElement & { client: StellarAppKit | null; open?: () => Promise<void> } | null>(null);

  const setModalRef = (el: HTMLElement & { client: StellarAppKit | null; open?: () => Promise<void> } | null) => {
    modalElRef.current = el;
    if (el && !el.client) {
      el.client = client;
    }
  };

  const openModal = async () => {
    const el = modalElRef.current;
    if (!el) return;
    if (!el.client) {
      el.client = client;
    }
    await el.open?.();
  };

  const cssVars = {
    '--sak-color-bg': theme.bg,
    '--sak-color-surface': theme.surface,
    '--sak-color-accent': theme.accent,
    '--sak-color-text': theme.text,
    '--sak-color-text-muted': theme.textMuted,
    '--sak-radius-lg': theme.radiusLg,
    '--sak-font-display': theme.fontDisplay,
  } as React.CSSProperties;

  const snippet = `:root {
${Object.entries(cssVars).filter(([, v]) => typeof v === 'string').map(([k, v]) => `  ${k}: ${v};`).join('\n')}
}`;

  return (
    <DemoPageLayout slug="theming-showcase">
      <div className="demo-page__layout">
        <DemoPanel title="Live preview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <label className="field__label">Preset</label>
              <select
                className="field__select"
                value={Object.entries(PRESETS).find(([, v]) => JSON.stringify(v) === JSON.stringify(theme))?.[0] ?? ''}
                onChange={(e) => setTheme(PRESETS[e.target.value])}
              >
                {Object.keys(PRESETS).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <ColorField label="Background" value={theme.bg} onChange={(v) => setTheme({ ...theme, bg: v })} />
              <ColorField label="Surface" value={theme.surface} onChange={(v) => setTheme({ ...theme, surface: v })} />
              <ColorField label="Accent" value={theme.accent} onChange={(v) => setTheme({ ...theme, accent: v })} />
              <ColorField label="Text" value={theme.text} onChange={(v) => setTheme({ ...theme, text: v })} />
            </div>

            <div className="field">
              <label className="field__label">Radius (large)</label>
              <input className="field__input" value={theme.radiusLg} onChange={(e) => setTheme({ ...theme, radiusLg: e.target.value })} />
            </div>

            <button className="btn btn--primary" onClick={openModal}>
              Open modal with this theme
            </button>
          </div>
        </DemoPanel>

        <DemoPanel title="CSS snippet">
          <pre style={{ fontSize: '0.75rem', maxHeight: '320px' }}>{snippet}</pre>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="How it works" full>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Every color, radius, and font in the modal is a CSS custom property
            on the host element. Override any of them via the <code>style</code>{' '}
            prop on <code>&lt;StellarAppKitModal&gt;</code> — styles cross the
            shadow boundary for the host element itself.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The snippet on the right is the exact CSS you'd paste into your own
            app — copy it into a global stylesheet targeting{' '}
            <code>saganta-appkit-modal</code>.
          </p>
        </DemoPanel>
      </div>

      <saganta-appkit-modal
        ref={setModalRef as never}
        mode="auto"
        theme="dark"
        style={cssVars}
      />
    </DemoPageLayout>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 36, border: '1px solid var(--color-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}
        />
        <input className="field__input" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1 }} />
      </div>
    </div>
  );
}
