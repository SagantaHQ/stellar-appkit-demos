'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSoroban } from '@saganta/stellar-appkit/react';
import { Networks } from '@stellar/stellar-sdk';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';
import { ErrorBlock } from '@/components/error-block';

const TOKEN_CONTRACT = 'CBETT2CXOPPQQT2KWYKNHI6W2W2O2VJVUFPJQIBKDS2KSVV7DSOLQXOX';

export default function TypedContractClientDemo() {
  return (
    <DemoPageLayout slug="typed-contract-client">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <TypedDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            <code>soroban.contract&lt;T&gt;(id, {'{ specEntries }'})</code>{' '}
            returns a typed client whose methods are derived from your TS
            interface. Calls like <code>token.transfer({'{ from, to, amount }'})</code>{' '}
            are fully typed — typos in method names or arg shapes are caught
            at compile time.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The <code>simulate()</code> method runs a read-only call — no
            signing, no wallet prompt, just simulation.
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

// Note: in your own app, you'd define this interface with the exact method
// signatures from your contract's spec. We're using `any` here to keep the
// demo simple — the stellar-appkit ContractClient type constraints are
// intentionally strict and a full working example needs the spec entries
// from `stellar contract bindings typescript`.
type TokenContract = Record<string, (args: object) => Promise<unknown>>;

function TypedDemo() {
  const { soroban } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callBalance = async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = soroban.contract<TokenContract>(TOKEN_CONTRACT, { specEntries: [] });
      const balance = await token.simulate('balance', { id: address }) as bigint;
      setResult({ method: 'balance', result: balance.toString() });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const callMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = soroban.contract<TokenContract>(TOKEN_CONTRACT, { specEntries: [] });
      const [name, symbol, decimals] = await Promise.all([
        token.simulate('name', {}),
        token.simulate('symbol', {}),
        token.simulate('decimals', {}),
      ]) as [string, string, number];
      setResult({ name, symbol, decimals });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConnectGate>
      {(session) => (
    <div>
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button className="btn btn--primary" onClick={() => callBalance(session.address)} disabled={loading}>
          {loading ? 'Simulating...' : 'token.balance(address)'}
        </button>
        <button className="btn" onClick={callMetadata} disabled={loading}>
          token.name() / symbol() / decimals()
        </button>
      </div>

      {result && (
        <>
          <div className="field__label" style={{ marginBottom: '0.375rem' }}>Result</div>
          <div className="result-block result-block--success">
            {JSON.stringify(result, null, 2)}
          </div>
        </>
      )}

      {error && (
        <div className="result-block result-block--error">{error}</div>
      )}
    </div>
      )}
    </ConnectGate>
  );
}

const CODE = `import { useSoroban, useSession } from '@saganta/stellar-appkit/react';

interface TokenContract {
  balance(args: { id: string }): Promise<bigint>;
  decimals(): Promise<number>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  transfer(args: { from: string; to: string; amount: bigint }): Promise<boolean>;
}

function TokenDemo() {
  const session = useSession();
  const { soroban } = useSoroban({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  });

  // Typed client — method names + arg shapes are checked by TypeScript
  const token = soroban.contract<TokenContract>('CBETT2CX...', { specEntries });

  async function checkBalance() {
    const balance = await token.simulate('balance', { id: session.address });
    console.log(balance); // bigint
  }

  async function transfer(to: string, amount: bigint) {
    // Full pipeline — opens the modal for signing
    await token.transfer({ from: session.address, to, amount });
  }
}`;
