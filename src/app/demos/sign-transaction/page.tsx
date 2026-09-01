'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSignTransaction } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';
import { ErrorBlock } from '@/components/error-block';

export default function SignTransactionDemo() {
  return (
    <DemoPageLayout slug="sign-transaction">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <SignDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Build a transaction with <code>@stellar/stellar-sdk</code>, then
            sign it via <code>useSignTransaction()</code>. The hook goes
            through the modal's preview flow by default — the modal opens
            automatically with decoded operations, risk flags, fee estimate,
            and balance deltas.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The user approves in the modal, then the wallet's own signature
            prompt appears. The result includes the signed XDR and the
            transaction hash.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            This demo builds a simple payment of <strong>1 XLM</strong> to a
            hardcoded Testnet address — safe to sign, won't actually submit.
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

const RECIPIENT = 'GD5G3X25PD6IS3KEUV3QFF2BYXUY2OIUPIV5A5TMX4DSKASDN3EG7CJ6'; // Testnet demo recipient (fund via friendbot.stellar.org)
const AMOUNT = '1';
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

function SignDemo() {
  const { sign, isSigning, data, error } = useSignTransaction();
  const [xdr, setXdr] = useState<string>('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const buildAndSign = async (session: { address: string }) => {
    setBuildError(null);
    setIsBuilding(true);
    try {
      const sdk = await import('@stellar/stellar-sdk');
      // Use Horizon (not Soroban RPC) to load the account — Horizon is the
      // canonical source for account sequence numbers for classic transactions.
      // Soroban RPC's getAccount only works for accounts that have interacted
      // with Soroban, which excludes freshly-created Testnet accounts.
      const horizon = new sdk.Horizon.Server(HORIZON_TESTNET);
      const account = await horizon.loadAccount(session.address);

      const tx = new sdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: sdk.Networks.TESTNET,
      })
        .addOperation(sdk.Operation.payment({
          destination: RECIPIENT,
          asset: sdk.Asset.native(),
          amount: AMOUNT,
        }))
        .setTimeout(300) // 5 min: the signed XDR must stay submittable after the modal preview + wallet approval roundtrip — 30s expires mid-flight
        .build();

      setXdr(tx.toXDR());
      await sign(tx.toXDR());
    } catch (err) {
      console.error('[sign-transaction demo] build/sign error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      // Extract the useful part of Stellar SDK errors (they often wrap the
      // real message in a longer "TransactionBuilder: ..." prefix).
      const cleanMsg = msg.replace(/^TransactionBuilder:\s*/i, '');
      setBuildError(cleanMsg);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <ConnectGate>
      {(session) => (
    <div>
      <div className="field">
        <label className="field__label">Recipient</label>
        <input className="field__input" value={RECIPIENT} readOnly />
      </div>
      <div className="field">
        <label className="field__label">Amount (XLM)</label>
        <input className="field__input" value={AMOUNT} readOnly />
      </div>

      <button
        className="btn btn--primary"
        onClick={() => buildAndSign(session)}
        disabled={isSigning || isBuilding}
      >
        {isBuilding ? 'Building transaction...' : isSigning ? 'Check your wallet...' : 'Build & sign transaction'}
      </button>

      {xdr && (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Unsigned XDR
          </div>
          <div className="result-block" style={{ maxHeight: '120px' }}>{xdr}</div>
        </>
      )}

      {data && (
        <>
          <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
            Signed result
          </div>
          <div className="result-block result-block--success">
            {JSON.stringify({ signedTxXdr: data.signedTxXdr, signerAddress: data.signerAddress }, null, 2)}
          </div>
        </>
      )}

      {buildError && (
        <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
          <strong>Build error:</strong> {buildError}
        </div>
      )}

      <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
    </div>
      )}
    </ConnectGate>
  );
}

const CODE = `import { useSignTransaction, useSession } from '@saganta/stellar-appkit-ui-web/react';

function SignButton() {
  const session = useSession();
  const { sign, isSigning, data, error } = useSignTransaction();

  async function handleSign() {
    const sdk = await import('@stellar/stellar-sdk');
    // Use Horizon to load the account (not Soroban RPC).
    const account = await new sdk.Horizon.Server('https://horizon-testnet.stellar.org')
      .loadAccount(session.address);

    const tx = new sdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: sdk.Networks.TESTNET,
    })
      .addOperation(sdk.Operation.payment({
        destination: 'GD5G3X25PD6IS3KEUV3QFF2BYXUY2OIUPIV5A5TMX4DSKASDN3EG7CJ6',
        asset: sdk.Asset.native(),
        amount: '1',
      }))
      .setTimeout(300) // 5 min — keeps the signed XDR submittable after a slow wallet approval
      .build();

    // sign() opens the modal preview automatically — decoded operations,
    // risk flags, fee estimate. User approves, then wallet prompts.
    const result = await sign(tx.toXDR());
    console.log(result.signedTxXdr, result.signerAddress);
  }

  return <button disabled={isSigning} onClick={handleSign}>Sign</button>;
}`;
