'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useRef, useState } from 'react';
import { useAppKit } from '@saganta/stellar-appkit-ui-web/react';
import type { StellarAppKit } from '@saganta/stellar-appkit';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';

type Mode = 'auto' | 'modal' | 'bottomsheet' | 'inline';

export default function ModalModesDemo() {
  const [mode, setMode] = useState<Mode>('auto');
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
            For <code>inline</code> mode, the modal fills its container — give
            the parent a defined width and height.
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
        />
      )}
    </DemoPageLayout>
  );
}
