# Stellar AppKit Examples

Live, copy-pasteable demos of [`@saganta/stellar-appkit`](https://github.com/SagantaHQ/stellar-appkit) — wallet connection, transaction signing, Soroban contract calls, and Sign-In With Stellar.

Built with **Next.js 15** + **OpenNext for Cloudflare** (deployed on Cloudflare Pages' Workers runtime).

## Demos

14 demos across 5 categories — each is a single Next.js route you can copy into your own app:

### Wallet Connection
- **Connect a Wallet** — the minimal modal-based flow
- **Wallet Picker** — build your own picker UI with `registry.listReachability()`
- **Network Mismatch Recovery** — typed `NetworkMismatchError` + auto-retry

### Signing & Previews
- **Sign a Transaction** — build XDR, sign through the modal preview
- **Sign a Message** — `signedData` field for SIWS verification
- **Custom Transaction Preview** — your own preview UI with `usePreviewTransaction()`

### Soroban
- **Soroban Contract Invoke** — full `invoke()` pipeline (build → simulate → sign → submit → poll)
- **Typed Contract Client** — `soroban.contract<T>()` with full TypeScript inference
- **RPC Failover** — multi-provider failover with health tracking

### Sign-In With Stellar
- **SIWS Sign-In** — full client + server flow with session cookie
- **SIWS Session via Middleware** — protect routes with Next.js middleware
- **SIWS Debug Verification** — diagnostics dump of every candidate byte sequence

### UI & Theming
- **Theming Showcase** — every CSS custom property, live preview
- **Modal Presentation Modes** — auto / modal / bottom-sheet / inline

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Cloudflare Pages

```bash
npm run deploy
```

This runs `opennextjs-cloudflare` (wraps the Next.js build for the Workers runtime) and `wrangler pages deploy`. The first deploy will prompt you to create a Cloudflare Pages project.

## Network

All demos run on **Stellar Testnet**. Connect a wallet with Testnet funds — get test XLM from the [friendbot faucet](https://friendbot.stellar.org).

## Stack

- [Next.js 15](https://nextjs.org) (App Router, React 19)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) — runs Next.js on Cloudflare Workers
- [@saganta/stellar-appkit](https://github.com/SagantaHQ/stellar-appkit) v0.2.0
- [@saganta/stellar-appkit-siws-verify](https://github.com/SagantaHQ/stellar-appkit) v0.2.0
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config, no `tailwind.config.js`)

## License

MIT
