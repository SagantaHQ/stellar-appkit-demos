'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import type { StellarAppKit } from '@saganta/stellar-appkit';
import { useAppKit } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';

type AnimationPreset = 'none' | 'fade' | 'scale' | 'scale-blur' | 'slide-up' | 'slide-left' | 'implode';
type Mode = 'auto' | 'modal' | 'bottomsheet';

interface PresetInfo {
  id: AnimationPreset;
  label: string;
  description: string;
  defaultFor?: 'modal' | 'bottomsheet';
}

const PRESETS: PresetInfo[] = [
  {
    id: 'none',
    label: 'none',
    description: 'Instant — no animation. Useful when you want full control via your own transition library.',
  },
  {
    id: 'fade',
    label: 'fade',
    description: 'Simple opacity 0→1 transition. Subtle, minimal, works everywhere.',
  },
  {
    id: 'scale',
    label: 'scale',
    description: 'Opacity 0→1 + scale(0.92)→1. A gentle "pop in" feel.',
  },
  {
    id: 'scale-blur',
    label: 'scale-blur',
    description: 'Opacity + scale + blur(12px)→0. The default for desktop modal — feels modern and polished.',
    defaultFor: 'modal',
  },
  {
    id: 'slide-up',
    label: 'slide-up',
    description: 'translateY(100%)→0 + opacity. The default for mobile bottom-sheet — slides up from the bottom.',
    defaultFor: 'bottomsheet',
  },
  {
    id: 'slide-left',
    label: 'slide-left',
    description: 'translateX(80px)→0 + opacity. Slides in from the right — useful for side panels.',
  },
  {
    id: 'implode',
    label: 'implode',
    description: 'scale(1.25) + rotate(8deg) + blur(20px) → scale(1). A dramatic Web3-style entrance.',
  },
];

export default function AnimationsDemo() {
  const [openPreset, setOpenPreset] = useState<AnimationPreset>('scale-blur');
  const [closePreset, setClosePreset] = useState<AnimationPreset>('scale-blur');
  const [mode, setMode] = useState<Mode>('modal');
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
    if (!el.client) el.client = client;
    // Set the attributes right before opening so the user sees the animation
    el.setAttribute('animation-open', openPreset);
    el.setAttribute('animation-close', closePreset);
    el.setAttribute('mode', mode);
    await el.open?.();
  };

  return (
    <DemoPageLayout slug="animations">
      <div className="demo-page__layout">
        <DemoPanel title="Try every animation preset">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="field">
              <label className="field__label">Presentation mode</label>
              <select className="field__select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="modal">modal (desktop, centered)</option>
                <option value="bottomsheet">bottomsheet (mobile, draggable)</option>
                <option value="auto">auto (modal on desktop, bottomsheet on mobile)</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label">Open animation</label>
              <select className="field__select" value={openPreset} onChange={(e) => setOpenPreset(e.target.value as AnimationPreset)}>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}{p.defaultFor ? ` (default for ${p.defaultFor})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label">Close animation</label>
              <select className="field__select" value={closePreset} onChange={(e) => setClosePreset(e.target.value as AnimationPreset)}>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}{p.defaultFor ? ` (default for ${p.defaultFor})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn--primary" onClick={openModal}>
              Open modal with these animations
            </button>
          </div>
        </DemoPanel>

        <DemoPanel title="Preset reference">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {PRESETS.map((p) => (
              <div key={p.id} style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <code style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{p.label}</code>
                  {p.defaultFor && (
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: '#d1fae5',
                      color: '#047857',
                      fontWeight: 600,
                    }}>
                      default: {p.defaultFor}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="How it works" full>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            The modal uses the native <strong>Web Animations API (WAAPI)</strong> for
            open/close transitions — zero dependencies, runs off the main thread
            for transform/opacity, supported in every modern browser.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Configuration priority</strong> (highest → lowest):
          </p>
          <ol style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>HTML attributes <code>animation-open</code> / <code>animation-close</code></li>
            <li>HTML attribute <code>animation</code> (single preset for both)</li>
            <li><code>StellarAppKit</code> config: <code>modal.animation</code></li>
            <li>Mode-based defaults (<code>scale-blur</code> for modal, <code>slide-up</code> for bottomsheet)</li>
          </ol>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Accessibility:</strong> every preset checks{' '}
            <code>prefers-reduced-motion: reduce</code> and becomes a no-op
            (instant open/close) when the user has reduced motion enabled.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Drag-to-dismiss coexistence:</strong> the bottom-sheet's
            drag gesture uses a separate custom spring engine (~30 lines,
            native Pointer Events + <code>requestAnimationFrame</code>).
            WAAPI handles programmatic open/close; the spring handles
            user-initiated drag-to-dismiss. They don't conflict.
          </p>
        </DemoPanel>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <DemoPanel title="Code" full>
          <CodeBlock code={CODE} language="html" />
        </DemoPanel>
      </div>

      <stellar-appkit-modal
        ref={setModalRef as never}
        mode={mode}
        theme="dark"
        animation-open={openPreset}
        animation-close={closePreset}
      />
    </DemoPageLayout>
  );
}

const CODE = `<!-- HTML: per-modal override -->
<stellar-appkit-modal
  animation-open="implode"
  animation-close="fade"
></stellar-appkit-modal>

<!-- HTML: single preset for both open and close -->
<stellar-appkit-modal animation="scale-blur"></stellar-appkit-modal>

<!-- HTML: defaults (no attribute needed) -->
<!-- modal mode → scale-blur, bottomsheet mode → slide-up -->
<stellar-appkit-modal mode="auto"></stellar-appkit-modal>

// TS: programmatic config (option 3 in priority order)
import { StellarAppKit } from '@saganta/stellar-appkit';

const appkit = new StellarAppKit({
  network: 'TESTNET',
  modal: { animation: 'scale-blur' },  // global default for all modals
});`;
