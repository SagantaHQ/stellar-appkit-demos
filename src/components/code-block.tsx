'use client';

import { useState } from 'react';
import { ShikiHighlighter, type Language } from 'react-shiki';

interface CodeBlockProps {
  code: string;
  language?: Language;
  /** Optional filename/title shown in the header bar */
  title?: string;
}

/**
 * A code block with syntax highlighting (via react-shiki) and a copy button.
 *
 * Uses the "github-dark" theme for dark mode and "github-light" for light mode.
 * The theme is selected based on the `dark` class on <html>.
 */
export function CodeBlock({ code, language = 'typescript', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available (e.g. insecure context) — silently fail
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__lang">{title ?? String(language)}</span>
        <button
          className="code-block__copy"
          onClick={copy}
          aria-label={copied ? 'Copied!' : 'Copy code'}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="code-block__body">
        <ShikiHighlighter
          language={language}
          theme="github-dark"
          addDefaultStyles={false}
          className="code-block__shiki"
        >
          {code.trim()}
        </ShikiHighlighter>
      </div>
    </div>
  );
}
