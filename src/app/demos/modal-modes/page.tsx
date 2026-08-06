'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useRef, useState } from 'react';
import { StellarAppKitModal, useConnect } from '@saganta/stellar-appkit/react';
import type { StellarAppKitModalHandle } from '@saganta/stellar-appkit/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';

type Mode = 'auto' | 'modal' | 'bottom-sheet' | 'inline';

export default function ModalModesDemo() {
  const [mode, setMode] = useState<Mode>('auto');
  const modalRef = useRef<StellarAppKitModalHandle>(null);

  return (
    <DemoPageLayout slug="modal-modes">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <label className="field__label">Presentation mode</label>
              <select className="field__select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="auto">auto (modal on desktop, bottom-sheet on mobile)</option>
                <option value="modal">modal (always centered)</option>
                <option value="bottom-sheet">bottom-sheet (always draggable sheet)</option>
                <option value="inline">inline (embedded, no overlay)</option>
              </select>
            </div>

            {mode !== 'inline' && (
              <button className="btn btn--primary" onClick={() => modalRef.current?.open()}>
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
            The <code>mode</code> prop controls how the modal is presented:
          </p>
          <ul style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0.75rem 0', paddingLeft: '1.25rem' }}>
            <li><code>auto</code> — modal on desktop (≥600px), bottom-sheet on mobile</li>
            <li><code>modal</code> — always centered with overlay</li>
            <li><code>bottom-sheet</code> — always draggable sheet (mobile-style)</li>
            <li><code>inline</code> — embedded in-page, no overlay, always visible</li>
          </ul>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            For <code>inline</code> mode, the modal fills its container — give
            the parent a defined width and height.
          </p>
        </DemoPanel>
      </div>

      {mode === 'inline' && (
        <div style={{ marginTop: '1.5rem' }}>
          <DemoPanel title="Inline modal (embedded)" full>
            <div style={{ minHeight: '420px' }}>
              <StellarAppKitModal mode="inline" theme="dark" />
            </div>
          </DemoPanel>
        </div>
      )}

      {mode !== 'inline' && (
        <StellarAppKitModal ref={modalRef} mode={mode} theme="dark" />
      )}
    </DemoPageLayout>
  );
}
