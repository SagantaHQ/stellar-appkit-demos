'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSignTransaction, useSession } from '@saganta/stellar-appkit/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
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
          <pre>{CODE}</pre>
        </DemoPanel>
      </div>
    </DemoPageLayout>
  );
}

const RECIPIENT = 'GA2C5RFPE6GCKMY3US5PAB6UZLKIGSPIUKSLRB6Q3IY7ZP4PAOMM43YA'; // well-known Testnet faucet
const AMOUNT = '1';

function SignDemo() {
  const session = useSession();
  const { sign, isSigning, data, error } = useSignTransaction();
  const [xdr, setXdr] = useState<string>('');

  const buildAndSign = async () => {
    if (!session) return;
    try {
      const sdk = await import('@stellar/stellar-sdk');
      const account = await new sdk.rpc.Server('https://soroban-testnet.stellar.org').getAccount(session.address);
      const tx = new sdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: sdk.Networks.TESTNET,
      })
        .addOperation(sdk.Operation.payment({
          destination: RECIPIENT,
          asset: sdk.Asset.native(),
          amount: AMOUNT,
        }))
        .setTimeout(30)
        .build();

      setXdr(tx.toXDR());
      await sign(tx.toXDR());
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) {
    return (
      <div className="empty-state">
        Connect a wallet first (use the <strong>Connect a Wallet</strong> demo above).
      </div>
    );
  }

  return (
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
        onClick={buildAndSign}
        disabled={isSigning}
      >
        {isSigning ? 'Check your wallet...' : 'Build & sign transaction'}
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

      <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
    </div>
  );
}

const CODE = `import { useSignTransaction, useSession } from '@saganta/stellar-appkit/react';

function SignButton() {
  const session = useSession();
  const { sign, isSigning, data, error } = useSignTransaction();

  async function handleSign() {
    const sdk = await import('@stellar/stellar-sdk');
    const account = await new sdk.rpc.Server('https://soroban-testnet.stellar.org')
      .getAccount(session.address);

    const tx = new sdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: sdk.Networks.TESTNET,
    })
      .addOperation(sdk.Operation.payment({
        destination: 'GA2C5RFPE6GCKMY3US5PAB6UZLKIGSPIUKSLRB6Q3IY7ZP4PAOMM43YA',
        asset: sdk.Asset.native(),
        amount: '1',
      }))
      .setTimeout(30)
      .build();

    // sign() opens the modal preview automatically — decoded operations,
    // risk flags, fee estimate. User approves, then wallet prompts.
    const result = await sign(tx.toXDR());
    console.log(result.signedTxXdr, result.signerAddress);
  }

  return <button disabled={isSigning} onClick={handleSign}>Sign</button>;
}`;
