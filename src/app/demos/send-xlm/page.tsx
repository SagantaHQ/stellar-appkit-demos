'use client';

// Force dynamic rendering — the modal uses HTMLElement which is undefined during SSR.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSignTransaction } from '@saganta/stellar-appkit-ui-web/react';
import { DemoPageLayout, DemoPanel } from '@/components/demo-page-layout';
import { CodeBlock } from '@/components/code-block';
import { ConnectGate } from '@/components/connect-gate';
import { ErrorBlock } from '@/components/error-block';

export default function SendXlmDemo() {
  return (
    <DemoPageLayout slug="send-xlm">
      <div className="demo-page__layout">
        <DemoPanel title="Live demo">
          <SendDemo />
        </DemoPanel>
        <DemoPanel title="How it works">
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            This demo builds a real <strong>payment operation</strong> with{' '}
            <code>@stellar/stellar-sdk</code>, signs it through the modal's preview
            flow, then <strong>submits it to Horizon Testnet</strong>. The signed
            transaction is broadcast to the network — the recipient will actually
            receive the XLM.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            The flow: load the source account from Horizon → build the payment XDR →{' '}
            <code>useSignTransaction()</code> opens the modal preview (decoded
            operations, risk flags, fee estimate) → user approves → wallet signs →{' '}
            submit the signed XDR to Horizon → poll for confirmation.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, margin: '1rem 0 0' }}>
            <strong>Testnet only.</strong> The default recipient is a Testnet
            demo address — feel free to change it to any Testnet account. Get
            Testnet XLM from the{' '}
            <a href="https://friendbot.stellar.org" target="_blank" rel="noopener">
              friendbot faucet
            </a>{' '}
            if your wallet is empty.
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

const DEFAULT_RECIPIENT = 'GD5G3X25PD6IS3KEUV3QFF2BYXUY2OIUPIV5A5TMX4DSKASDN3EG7CJ6';
const DEFAULT_AMOUNT = '1';
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

interface SubmitSuccess {
  hash: string;
  explorerUrl: string;
}

function SendDemo() {
  const { sign, isSigning, error } = useSignTransaction();
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedXdr, setSignedXdr] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<SubmitSuccess | null>(null);

  const reset = () => {
    setBuildError(null);
    setSignedXdr('');
    setSubmitSuccess(null);
  };

  const buildSignAndSubmit = async (session: { address: string }) => {
    reset();
    setIsBuilding(true);
    try {
      const sdk = await import('@stellar/stellar-sdk');
      // Load the source account from Horizon — gives us the current sequence
      // number so the transaction is valid for submission.
      const horizon = new sdk.Horizon.Server(HORIZON_TESTNET);
      const account = await horizon.loadAccount(session.address);

      // Validate the recipient address before building — fails fast with a
      // clear error instead of a cryptic SDK error.
      if (!sdk.StrKey.isValidEd25519PublicKey(recipient)) {
        throw new Error('Recipient is not a valid G... address');
      }
      // Validate the amount — must be a positive number.
      const amountNum = parseFloat(amount);
      if (!isFinite(amountNum) || amountNum <= 0) {
        throw new Error('Amount must be a positive number');
      }

      const tx = new sdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: sdk.Networks.TESTNET,
      })
        .addOperation(sdk.Operation.payment({
          destination: recipient,
          asset: sdk.Asset.native(),
          amount: amount,
        }))
        .setTimeout(30)
        .build();

      setIsBuilding(false);
      setSignedXdr(tx.toXDR());

      // sign() opens the modal preview automatically — decoded operations,
      // risk flags, fee estimate. User approves, then wallet prompts.
      const signed = await sign(tx.toXDR());
      setSignedXdr(signed.signedTxXdr);

      // Submit the signed transaction to Horizon for inclusion in the ledger.
      // This actually moves the XLM — the recipient will see it land.
      setIsSubmitting(true);
      const txBlob = new sdk.Transaction(signed.signedTxXdr, sdk.Networks.TESTNET);
      const result = await horizon.submitTransaction(txBlob);
      setIsSubmitting(false);

      if (result.successful) {
        setSubmitSuccess({
          hash: result.hash,
          explorerUrl: `https://testnet.stellarchain.io/tx/${result.hash}`,
        });
      } else {
        // Horizon returns result.successful=false when the transaction was
        // submitted but rejected by the network (e.g. insufficient balance,
        // bad sequence number, op_underfunded). Extract the result codes.
        const opResults = (result as { extras?: { result_codes?: { operations?: string[]; transaction?: string } } }).extras?.result_codes;
        const txCode = opResults?.transaction ?? 'unknown';
        const opCodes = opResults?.operations ?? [];
        throw new Error(`Transaction rejected by network (tx: ${txCode}${opCodes.length ? `, ops: ${opCodes.join(', ')}` : ''})`);
      }
    } catch (err) {
      console.error('[send-xlm demo] error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      // Extract the useful part of Stellar SDK errors (they often wrap the
      // real message in a longer "TransactionBuilder: ..." prefix).
      const cleanMsg = msg.replace(/^TransactionBuilder:\s*/i, '');
      setBuildError(cleanMsg);
    } finally {
      setIsBuilding(false);
      setIsSubmitting(false);
    }
  };

  const isBusy = isBuilding || isSigning || isSubmitting;

  return (
    <ConnectGate>
      {(session) => (
        <div>
          <div className="field">
            <label className="field__label" htmlFor="send-xlm-recipient">Recipient</label>
            <input
              id="send-xlm-recipient"
              className="field__input"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              placeholder="G..."
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              disabled={isBusy}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="send-xlm-amount">Amount (XLM)</label>
            <input
              id="send-xlm-amount"
              className="field__input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1"
              inputMode="decimal"
              disabled={isBusy}
            />
          </div>

          <button
            className="btn btn--primary"
            onClick={() => buildSignAndSubmit(session)}
            disabled={isBusy}
          >
            {isBuilding
              ? 'Loading account...'
              : isSigning
                ? 'Check your wallet...'
                : isSubmitting
                  ? 'Submitting to network...'
                  : 'Send XLM'}
          </button>

          {signedXdr && !submitSuccess && (
            <>
              <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
                Signed XDR {isSubmitting && '(submitting...)'}
              </div>
              <div className="result-block" style={{ maxHeight: '120px' }}>{signedXdr}</div>
            </>
          )}

          {submitSuccess && (
            <>
              <div className="field__label" style={{ marginTop: '1rem', marginBottom: '0.375rem' }}>
                Transaction submitted
              </div>
              <div className="result-block result-block--success">
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Hash:</strong>{' '}
                  <code style={{ wordBreak: 'break-all', fontSize: '0.8125rem' }}>{submitSuccess.hash}</code>
                </div>
                <a
                  href={submitSuccess.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem' }}
                >
                  View on Stellar Explorer →
                </a>
              </div>
            </>
          )}

          {buildError && (
            <div className="result-block result-block--error" style={{ marginTop: '1rem' }}>
              <strong>Error:</strong> {buildError}
            </div>
          )}

          <ErrorBlock error={error} style={{ marginTop: '1rem' }} />
        </div>
      )}
    </ConnectGate>
  );
}

const CODE = `import { useSignTransaction } from '@saganta/stellar-appkit-ui-web/react';

function SendButton({ session }: { session: { address: string } }) {
  const { sign, isSigning, error } = useSignTransaction();

  async function handleSend() {
    const sdk = await import('@stellar/stellar-sdk');
    const horizon = new sdk.Horizon.Server('https://horizon-testnet.stellar.org');

    // 1. Load the source account (gives us the current sequence number)
    const account = await horizon.loadAccount(session.address);

    // 2. Build the payment transaction
    const tx = new sdk.TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: sdk.Networks.TESTNET,
    })
      .addOperation(sdk.Operation.payment({
        destination: 'GD5G3X25PD6IS3KEUV3QFF2BYXUY2OIUPIV5A5TMX4DSKASDN3EG7CJ6',
        asset: sdk.Asset.native(),  // native = XLM
        amount: '1',
      }))
      .setTimeout(30)
      .build();

    // 3. Sign via the modal preview (user approves, then wallet signs)
    const signed = await sign(tx.toXDR());

    // 4. Submit the signed transaction to Horizon — this actually moves the XLM
    const txBlob = new sdk.Transaction(signed.signedTxXdr, sdk.Networks.TESTNET);
    const result = await horizon.submitTransaction(txBlob);

    if (result.successful) {
      console.log('Submitted! Hash:', result.hash);
    } else {
      console.error('Rejected:', result.extras.result_codes);
    }
  }

  return (
    <button disabled={isSigning} onClick={handleSend}>
      Send 1 XLM
    </button>
  );
}`;
