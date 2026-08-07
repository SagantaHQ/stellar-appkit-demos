'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useRef, useState } from 'react';
import { useAppKit } from '@saganta/stellar-appkit-ui-web/react';
import type { StellarAppKit } from '@saganta/stellar-appkit';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';

type Mode = 'auto' | 'modal' | 'bottomsheet' | 'inline';
type AnimationPreset = 'default' | 'none' | 'fade' | 'scale' | 'scale-blur' | 'slide-up' | 'slide-left' | 'implode';

const ANIMATION_PRESETS: { value: AnimationPreset; label: string }[] = [
  { value: 'default', label: 'default (scale-blur for modal, slide-up for bottomsheet)' },
  { value: 'none', label: 'none (instant)' },
  { value: 'fade', label: 'fade (opacity only)' },
  { value: 'scale', label: 'scale (opacity + scale)' },
  { value: 'scale-blur', label: 'scale-blur (opacity + scale + blur)' },
  { value: 'slide-up', label: 'slide-up (translateY, mobile-style)' },
  { value: 'slide-left', label: 'slide-left (translateX)' },
  { value: 'implode', label: 'implode (scale + rotate + blur — Web3 entrance)' },
];

export default function ModalModesDemo() {
  const [mode, setMode] = useState<Mode>('auto');
  const [animation, setAnimation] = useState<AnimationPreset>('default');
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

  const animationAttr = animation === 'default' ? undefined : animation;

  return (
    <DemoPageLayout slug="modal-modes">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <label className="field__label">Presentation mode</label>
              <select className="field__select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="auto">auto (modal on desktop, bottomsheet on mobile)</option>
                <option value="modal">modal (always centered)</option>
                <option value="bottomsheet">bottomsheet (always draggable sheet)</option>
                <option value="inline">inline (embedded, no overlay)</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label">Open / close animation</label>
              <select
                className="field__select"
                value={animation}
                onChange={(e) => setAnimation(e.target.value as AnimationPreset)}
              >
                {ANIMATION_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Animations are zero-dependency WAAPI. <code>prefers-reduced-motion</code> is respected automatically.
              </div>
            </div>

            {mode !== 'inline' && (
              <button className="btn btn--primary" onClick={openModal}>
                Open modal
              </button>
            )}

            {mode === 'inline' && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Inline mode renders in place — the modal below is always visible.
              </div>
            )}
          </div>
        </DemoPanel>

        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            The <code>mode</code> attribute controls how the modal is presented:
          </p>
          <ul style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
            <li><code>auto</code> — modal on desktop (≥600px), bottomsheet on mobile</li>
            <li><code>modal</code> — always centered with overlay</li>
            <li><code>bottomsheet</code> — always draggable sheet (mobile-style)</li>
            <li><code>inline</code> — embedded in-page, no overlay, always visible</li>
          </ul>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The <code>animation</code> attribute controls the open/close transition.
            Default is <code>scale-blur</code> for modal, <code>slide-up</code> for bottomsheet.
            Override per-modal via HTML attributes, or globally via the{' '}
            <code>StellarAppKit</code> config&apos;s <code>modal.animation</code> field.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The bottom-sheet&apos;s drag-to-dismiss uses a separate custom spring engine
            (zero dependencies — native Pointer Events + <code>requestAnimationFrame</code>),
            so dragging and WAAPI transitions don&apos;t conflict.
          </p>
        </DemoPanel>
      </div>

      {mode === 'inline' ? (
        <div style={{ marginTop: '1.5rem' }}>
          <DemoPanel title="Inline modal (embedded)" full>
            <div style={{ minHeight: '420px' }}>
              <saganta-appkit-modal
                ref={setModalRef as never}
                mode="inline"
                theme="dark"
              />
            </div>
          </DemoPanel>
        </div>
      ) : (
        <saganta-appkit-modal
          ref={setModalRef as never}
          mode={mode}
          theme="dark"
          {...(animationAttr ? { animation: animationAttr } : {})}
        />
      )}
    </DemoPageLayout>
  );
}
