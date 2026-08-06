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

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) to run Next.js on Cloudflare's Workers runtime. The build produces a `.open-next/` directory that Cloudflare Pages deploys.

### Option A — Connect via Cloudflare dashboard (recommended)

1. Push this repo to GitHub.
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Select this repo.
4. Set the build configuration:
   - **Framework preset**: `Next.js` (or "None" if Cloudflare mis-detects)
   - **Build command**: `npm run build`
   - **Build output directory**: `.open-next`
   - **Environment variables**: add `NODE_VERSION` = `20` (or later) if the default fails
5. Click **Save and Deploy**.

Cloudflare will run `npm run build` (which is `opennextjs-cloudflare build` — see `package.json`), produce `.open-next/`, and deploy it. The first build takes ~3-5 minutes.

> **Important**: do NOT set the build command to `next build` — that produces `.next/`, not `.open-next/`, and Cloudflare's OpenNext detection will fail with `Could not find compiled Open Next config`.

### Option B — Deploy via Wrangler CLI

```bash
# Login once
npx wrangler login

# Build + deploy
npm run deploy
```

This runs `opennextjs-cloudflare build && wrangler pages deploy .open-next/dist`. The first deploy will prompt you to create a Cloudflare Pages project.

### Local production preview (Cloudflare simulation)

```bash
npm run preview
```

This builds with OpenNext and serves the production build locally via `wrangler pages dev` — useful for testing the Workers runtime before deploying.

### Build scripts reference

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server (hot reload, no OpenNext) |
| `npm run build:next` | Plain `next build` — produces `.next/` (for type-checking / linting) |
| `npm run build` | **OpenNext build** — produces `.open-next/` (for Cloudflare deployment) |
| `npm run preview` | OpenNext build + local `wrangler pages dev` |
| `npm run deploy` | OpenNext build + `wrangler pages deploy` |

> Cloudflare Pages runs `npm run build` by default — that's why `build` is configured to run the OpenNext build, not plain `next build`. Use `npm run build:next` locally when you just want to type-check or verify the Next.js build without the OpenNext wrapper.

### Troubleshooting

**`Could not find compiled Open Next config`** — Cloudflare ran `next build` instead of `opennextjs-cloudflare build`. Check that the build command in the Cloudflare dashboard is `npm run build` (not `next build`), and that the build output directory is `.open-next` (not `.next`).

**Build OOMs locally** — the OpenNext build needs ~4-6GB RAM. If your machine has less, use Cloudflare's build environment (8GB) instead of building locally. You can still develop locally with `npm run dev` (which doesn't run OpenNext).

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
