'use client';

/**
 * DebugPanel — a floating debug console for mobile WebView testing.
 *
 * Mobile WebViews (especially Android) don't have access to browser DevTools,
 * making it nearly impossible to diagnose silent errors, console.log output,
 * or unhandled promise rejections. This component captures all of that and
 * displays it in a collapsible panel at the bottom of the screen.
 *
 * Captures:
 * - console.log / console.warn / console.error / console.info / console.debug
 * - window.onerror (uncaught exceptions)
 * - window.onunhandledrejection (unhandled promise rejections)
 * - Network request errors (fetch + XMLHttpRequest)
 * - Stellar AppKit specific: ConnectError, SiwsError, NetworkMismatchError
 * - WalletConnect relay errors
 *
 * Features:
 * - Floating button (bottom-right) to toggle the panel
 * - Panel slides up from the bottom (mobile-friendly)
 * - Color-coded log levels (red=error, yellow=warn, blue=info, gray=log)
 * - Clear button, copy-all button, filter by level
 * - Auto-scrolls to latest entry
 * - Collapsible/closable
 * - Persists open/closed state in sessionStorage
 * - Captures up to 500 entries (FIFO)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'network';

interface LogEntry {
  id: number;
  level: LogLevel;
  message: string;
  timestamp: string;
  stack?: string;
  source?: string;
}

const MAX_ENTRIES = 500;
const LEVEL_COLORS: Record<LogLevel, string> = {
  log: '#9aa0a6',
  info: '#60a5fa',
  warn: '#fbbf24',
  error: '#f87171',
  debug: '#a78bfa',
  network: '#34d399',
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  log: 'LOG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERR',
  debug: 'DBG',
  network: 'NET',
};

let entryIdCounter = 0;

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef<LogEntry[]>([]);

  // Keep entriesRef in sync so the global error handlers can append
  entriesRef.current = entries;

  const addEntry = useCallback((level: LogLevel, message: string, stack?: string, source?: string) => {
    const entry: LogEntry = {
      id: ++entryIdCounter,
      level,
      message,
      stack,
      source,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
    };
    setEntries((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_ENTRIES) next.shift();
      return next;
    });
    if (!isOpen) setUnreadCount((c) => c + 1);
  }, [isOpen]);

  // Install global error/warning capture on mount
  useEffect(() => {
    // --- Capture console methods ---
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    const captureConsole = (level: LogLevel) =>
      (...args: unknown[]) => {
        const message = args.map((a) => formatValue(a)).join(' ');
        const stack = new Error().stack;
        addEntry(level, message, stack?.split('\n').slice(2, 5).join('\n'));
        // Call the original — only for console log levels (not 'network')
        const consoleKey = level === 'network' ? 'log' : level;
        const fn = originalConsole[consoleKey as keyof typeof originalConsole];
        if (fn) fn(...args);
      };

    console.log = captureConsole('log');
    console.info = captureConsole('info');
    console.warn = captureConsole('warn');
    console.error = captureConsole('error');
    console.debug = captureConsole('debug');

    // --- Capture window.onerror (uncaught exceptions) ---
    const onError = (event: ErrorEvent) => {
      addEntry('error', `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, event.error?.stack, 'window.onerror');
    };
    window.addEventListener('error', onError);

    // --- Capture unhandled promise rejections ---
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : formatValue(reason);
      addEntry('error', `Unhandled rejection: ${message}`, reason instanceof Error ? reason.stack : undefined, 'unhandledrejection');
    };
    window.addEventListener('unhandledrejection', onRejection);

    // --- Capture fetch errors ---
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url ?? 'unknown';
      const method = (args[1]?.method) ?? (args[0] as Request)?.method ?? 'GET';
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          addEntry('network', `${method} ${url} → ${response.status} ${response.statusText}`);
        }
        return response;
      } catch (err) {
        addEntry('network', `${method} ${url} → FAILED: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
    };

    // --- Capture XMLHttpRequest errors ---
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: any[]) {
      (this as unknown as { _debugMethod?: string; _debugUrl?: string })._debugMethod = args[0];
      (this as unknown as { _debugMethod?: string; _debugUrl?: string })._debugUrl = String(args[1]);
      return (originalXHROpen as unknown as (...a: unknown[]) => void).apply(this, args);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: any[]) {
      this.addEventListener('error', () => {
        const meta = this as unknown as { _debugMethod?: string; _debugUrl?: string };
        addEntry('network', `${meta._debugMethod ?? 'GET'} ${meta._debugUrl ?? 'unknown'} → FAILED (network error)`);
      });
      this.addEventListener('load', () => {
        if (this.status >= 400) {
          const meta = this as unknown as { _debugMethod?: string; _debugUrl?: string };
          addEntry('network', `${meta._debugMethod ?? 'GET'} ${meta._debugUrl ?? 'unknown'} → ${this.status} ${this.statusText}`);
        }
      });
      return (originalXHRSend as unknown as (...a: unknown[]) => void).apply(this, args);
    };

    // --- Restore on unmount ---
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
    };
  }, [addEntry]);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, isOpen]);

  // Reset unread count when opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const handleClear = () => setEntries([]);
  const handleCopy = () => {
    const text = entries
      .filter((e) => filter === 'all' || e.level === filter)
      .map((e) => `[${e.timestamp}] ${LEVEL_LABELS[e.level]} ${e.source ? `(${e.source}) ` : ''}${e.message}${e.stack ? '\n' + e.stack : ''}`)
      .join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      addEntry('info', 'Debug log copied to clipboard');
    });
  };

  const filteredEntries = filter === 'all' ? entries : entries.filter((e) => e.level === filter);
  const errorCount = entries.filter((e) => e.level === 'error').length;
  const warnCount = entries.filter((e) => e.level === 'warn').length;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 999999,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: errorCount > 0 ? '#f87171' : warnCount > 0 ? '#fbbf24' : '#1a1a1a',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s, background 0.2s',
        }}
        aria-label="Toggle debug panel"
        title={`Debug panel — ${entries.length} entries${errorCount > 0 ? ` (${errorCount} errors)` : ''}`}
      >
        {isOpen ? '✕' : '🐛'}
        {unreadCount > 0 && !isOpen && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#f87171',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '10px',
            padding: '2px 6px',
            minWidth: '18px',
            textAlign: 'center',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '45vh',
          maxHeight: '400px',
          background: '#0d0d0d',
          borderTop: '2px solid #333',
          zIndex: 999998,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          fontSize: '12px',
          color: '#e0e0e0',
        }}>
          {/* Header bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#1a1a1a',
            borderBottom: '1px solid #333',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>🐛 Debug Console</span>
            <span style={{ color: '#666', fontSize: '11px' }}>
              {entries.length} entries{errorCount > 0 && <span style={{ color: '#f87171' }}> · {errorCount} errors</span>}{warnCount > 0 && <span style={{ color: '#fbbf24' }}> · {warnCount} warnings</span>}
            </span>
            <div style={{ flex: 1 }} />
            {/* Filter buttons */}
            {(['all', 'error', 'warn', 'info', 'log', 'network'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: filter === f ? (f === 'error' ? '#f87171' : f === 'warn' ? '#fbbf24' : f === 'info' ? '#60a5fa' : f === 'network' ? '#34d399' : '#666') : '#333',
                  background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: filter === f ? (f === 'error' ? '#f87171' : f === 'warn' ? '#fbbf24' : f === 'info' ? '#60a5fa' : f === 'network' ? '#34d399' : '#e0e0e0') : '#666',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {f}
              </button>
            ))}
            <button onClick={handleCopy} style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', border: '1px solid #333', background: 'transparent', color: '#666', cursor: 'pointer' }} title="Copy all to clipboard">
              📋
            </button>
            <button onClick={handleClear} style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', border: '1px solid #333', background: 'transparent', color: '#666', cursor: 'pointer' }} title="Clear all">
              🗑
            </button>
          </div>

          {/* Log entries */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {filteredEntries.length === 0 ? (
              <div style={{ padding: '16px', color: '#555', textAlign: 'center' }}>No entries yet. Interact with the app to generate logs.</div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '4px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    borderLeft: `3px solid ${LEVEL_COLORS[entry.level]}`,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <span style={{ color: '#555', fontSize: '10px' }}>{entry.timestamp}</span>{' '}
                  <span style={{ color: LEVEL_COLORS[entry.level], fontWeight: 700, fontSize: '10px' }}>{LEVEL_LABELS[entry.level]}</span>
                  {entry.source && <span style={{ color: '#555', fontSize: '10px' }}> ({entry.source})</span>}
                  {' '}
                  <span style={{ color: entry.level === 'error' ? '#f87171' : entry.level === 'warn' ? '#fbbf24' : '#e0e0e0' }}>{entry.message}</span>
                  {entry.stack && (
                    <pre style={{ color: '#666', fontSize: '10px', marginTop: '2px', whiteSpace: 'pre-wrap', paddingLeft: '8px' }}>{entry.stack}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Format any value as a string for display in the debug panel. */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof ErrorEvent) return `${value.message} at ${value.filename}:${value.lineno}`;
  if (value instanceof PromiseRejectionEvent) return formatValue(value.reason);
  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return String(value);
  }
}
