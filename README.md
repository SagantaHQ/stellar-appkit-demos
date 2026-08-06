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

## Deploy to Cloudflare Workers

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) to run Next.js on Cloudflare's **Workers** runtime (not Pages). OpenNext builds the Next.js app into a Worker + static assets that Cloudflare deploys as a single Worker.

The `wrangler.jsonc` in the repo root is the Cloudflare Workers config — it points `main` at `.open-next/worker.js` and `assets.directory` at `.open-next/assets`. OpenNext populates these during build.

### Option A — Connect via Cloudflare dashboard (recommended)

1. Push this repo to GitHub.
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create → Workers → Connect to Git**.
3. Select this repo.
4. Set the build configuration:
   - **Build command**: `npx opennextjs-cloudflare build`
   - **Deploy command**: `npx opennextjs-cloudflare deploy`
   - **Environment variables**: add `NODE_VERSION` = `20` (or later) if the default fails
5. Click **Save and Deploy**.

The build command runs `opennextjs-cloudflare build`, which internally calls `npm run build` (= `next build`) and then bundles the output for the Workers runtime, producing `.open-next/`. The deploy command then deploys the Worker to Cloudflare. The first build takes ~3-5 minutes.

> **Important**: This is a **Workers** project, not a Pages project. Create it under **Workers → Connect to Git**, not Pages. If you see "Are you sure you want to proceed? wrangler deploy on a Pages project" — you're using the wrong project type. Delete it and create a Workers project instead.

### Option B — Deploy via Wrangler CLI

```bash
# Login once
npx wrangler login

# Build + deploy
npm run deploy
```

This runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. The first deploy will create the Worker automatically.

### Local production preview (Cloudflare simulation)

```bash
npm run preview
```

This builds with OpenNext and serves the production build locally via `wrangler dev` — useful for testing the Workers runtime before deploying.

### Build scripts reference

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server (hot reload, no OpenNext) |
| `npm run build` | Plain `next build` — produces `.next/` (called by OpenNext internally) |
| `npm run build:cloudflare` | **OpenNext build** — produces `.open-next/` (for Cloudflare deployment) |
| `npm run preview` | OpenNext build + local `wrangler dev` |
| `npm run deploy` | OpenNext build + `opennextjs-cloudflare deploy` |

> The `build` script is `next build` because OpenNext calls `npm run build` internally. If you set `build` to `opennextjs-cloudflare build`, OpenNext would call `npm run build` → `opennextjs-cloudflare build` → `npm run build` → infinite recursion. The Cloudflare build command should be `npx opennextjs-cloudflare build` (or `npm run build:cloudflare`).

### Troubleshooting

**"Are you sure you want to proceed? wrangler deploy on a Pages project"** — you created a Pages project instead of a Workers project. OpenNext for Cloudflare deploys as a Worker, not a Pages site. Delete the Pages project and create a **Workers** project instead (Workers & Pages → Create → Workers → Connect to Git).

**`Could not find compiled Open Next config`** — the deploy command ran but `.open-next/.build/open-next.config.edge.mjs` doesn't exist. This means either (a) the build command didn't run `opennextjs-cloudflare build`, or (b) the build command was `npm run build` (= `next build`) which produces `.next/` not `.open-next/`. Fix: set the build command to `npx opennextjs-cloudflare build`.

**Build hangs / infinite loop** — if the `build` script is set to `opennextjs-cloudflare build`, OpenNext calls `npm run build` which calls `opennextjs-cloudflare build` which calls `npm run build` forever. Fix: keep `build` as `next build`, use `npx opennextjs-cloudflare build` as the Cloudflare build command.

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
