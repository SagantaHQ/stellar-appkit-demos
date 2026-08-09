'use client';

/**
 * Safely renders an `unknown` error value as a string.
 *
 * The @saganta/stellar-appkit hooks (useSignTransaction, useSignMessage,
 * useSignIn, useSoroban) return `error: unknown` because the underlying
 * client can throw arbitrary values (ConnectError instances, plain strings,
 * Error objects, etc.). React 19 + TypeScript strict mode rejects `unknown`
 * directly in JSX conditionals, so this helper normalizes it.
 */
export function ErrorBlock({ error, style }: { error: unknown; style?: React.CSSProperties }) {
  if (error === null || error === undefined) return null;
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : JSON.stringify(error);
  return (
    <div className="result-block result-block--error" style={style}>
      {message}
    </div>
  );
}
