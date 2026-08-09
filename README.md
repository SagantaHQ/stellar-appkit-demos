# Stellar AppKit Demos

**Live at [demos.stellar-appkit.saganta.com](https://demos.stellar-appkit.saganta.com)**

Live, copy-pasteable demos of [`@saganta/stellar-appkit`](https://github.com/sagantaHQ/stellar-appkit) — wallet connection, transaction signing, Soroban contract calls, and Sign-In With Stellar.

- **Docs:** [stellar-appkit.saganta.com](https://stellar-appkit.saganta.com)
- **Library:** [github.com/sagantaHQ/stellar-appkit](https://github.com/sagantaHQ/stellar-appkit)
- **npm:** [@saganta/stellar-appkit](https://www.npmjs.com/package/@saganta/stellar-appkit)

Built with **Next.js 15** + **OpenNext for Cloudflare** (deployed on Cloudflare Workers).

## Demos

19 demos across 5 categories — each is a single Next.js route you can copy into your own app:

### Wallet Connection
- **Connect a Wallet** — the minimal modal-based flow
- **Wallet Picker** — build your own picker UI with `registry.listReachability()`
- **WalletConnect (Hana, Lobstr)** — connect mobile wallets via the modal's built-in QR pairing (requires `NEXT_PUBLIC_REOWN_PROJECT_ID`)
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
- **SIWS Session Management (v1.7.x)** — `useSiwsSession()`, `useIsAuthenticated()`, `signOut()`, `validateSession()`, `reauthenticate()`, and persistence across reloads
- **SIWS Debug Verification** — diagnostics dump of every candidate byte sequence

### UI & Theming
- **Theming Showcase** — every CSS custom property, live preview
- **Modal Presentation Modes & Animations** — auto / modal / bottom-sheet / inline + WAAPI animation presets
- **Animation Presets** — focused demo of every WAAPI animation preset
- **Internationalization (25 Locales)** — switch the modal UI between 25 languages in real-time (v1.8.0+)

## Environment variables

The WalletConnect demo requires a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com) (free). Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_REOWN_PROJECT_ID
```

| Variable | Required for | Description |
|---|---|---|
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | `/demos/walletconnect` | WalletConnect Cloud project ID — enables Hana, Lobstr, Hot Wallet |
| `NEXT_PUBLIC_GA_ID` | (optional) | Google Analytics ID (`G-XXXXXXXXXX`) |

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Linked library (no npm publish wait)

The demos `package.json` references `@saganta/stellar-appkit`, `@saganta/stellar-appkit-ui-web`, and `@saganta/stellar-appkit-siws-verify` via **`file:` paths** pointing at a sibling clone of the library repo. This means the demos always picks up whatever is in your local `../stellar-appkit/` checkout — you don't have to wait for an npm publish to test a library change against the demos.

The `npm install` lifecycle hooks call `scripts/sync-lib.mjs` automatically:

| Hook | What it does |
|---|---|
| `preinstall`  | `sync-lib.mjs --clone-only` — clones the library into `../stellar-appkit/` if missing, so npm can resolve the `file:` paths. |
| `postinstall` | `sync-lib.mjs` — idempotent. Ensures the library has `node_modules` and a built `dist/` for every package. No-op if already done. |
| `predev`      | Same as `postinstall` — makes sure the library is built before `next dev` starts. |
| `prebuild`    | Same as `postinstall` — makes sure the library is built before `opennextjs-cloudflare build` / `next build` runs. |

All of these are **idempotent** — they're no-ops on the happy path. The only required step on a fresh checkout is `npm install`; everything else happens automatically.

#### Manual sync commands

```bash
npm run sync:lib         # idempotent — clone if missing, install if missing, build if missing
npm run sync:lib:pull    # git pull + force rebuild — use after someone else pushed library changes
npm run sync:lib:build   # force rebuild without pulling — use after you edit library source locally
```

#### Typical library-dev workflow

1. Edit a file in `../stellar-appkit/packages/core/src/...`
2. Run `npm run sync:lib:build` from the demos (rebuilds the library's `dist/`)
3. Run `npm run dev` — the demos' `predev` hook will be a no-op (already built), and the dev server picks up the new code

For live reload on library source changes, run TypeScript in watch mode in a second terminal:

```bash
# Terminal 1 — rebuild library on every save
cd ../stellar-appkit
npm run build --workspaces -- --watch  # or `tsc -p packages/core/tsconfig.json --watch`

# Terminal 2 — demos dev server (hot-reloads Next.js code)
cd ../stellar-appkit-demos
npm run dev
```

#### Cloudflare CI / fresh build environments

Cloudflare's build container starts with an empty workspace. The `preinstall` hook will `git clone` the library on first run, and the `postinstall` + `prebuild` hooks will install its deps and build it. No special CI configuration needed — `npm install && npm run build` is sufficient.

> **Note**: The first build on CI will be slower (~1–2 min extra) because it clones + builds the library. Subsequent builds reuse the cached `../stellar-appkit/node_modules/` and `dist/` if Cloudflare caches the workspace between builds.

## Deploy to Cloudflare Workers

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) to run Next.js on Cloudflare's **Workers** runtime (not Pages). OpenNext builds the Next.js app into a Worker + static assets that Cloudflare deploys as a single Worker.

The `wrangler.jsonc` in the repo root is the Cloudflare Workers config — it points `main` at `.open-next/worker.js` and `assets.directory` at `.open-next/assets`. OpenNext populates these during build.

The `build` npm script is `opennextjs-cloudflare build` — this is what Cloudflare's build step runs. OpenNext internally calls `next build` (via the `buildCommand` override in `open-next.config.ts`) and then bundles for Workers, producing `.open-next/`.

### Option A — Connect via Cloudflare dashboard (recommended)

1. Push this repo to GitHub.
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create → Workers → Connect to Git**.
3. Select this repo.
4. Set the build configuration:
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy`
   - **Environment variables**: add `NODE_VERSION` = `20` (or later) if the default fails
5. Click **Save and Deploy**.

The build command runs `npm run build` (= `opennextjs-cloudflare build`), which calls `next build` internally and then bundles for Workers, producing `.open-next/`. The deploy command runs `npx wrangler deploy`, which detects the OpenNext project and deploys the Worker. The first build takes ~3-5 minutes.

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
| `npm run dev` | Next.js dev server (hot reload, no OpenNext). `predev` hook first ensures `../stellar-appkit` is built. |
| `npm run build` | **OpenNext build** — produces `.open-next/` (for Cloudflare deployment). `prebuild` hook first ensures `../stellar-appkit` is built. |
| `npm run build:next` | Plain `next build` — produces `.next/` (for local type-checking). |
| `npm run preview` | OpenNext build + local `wrangler dev`. |
| `npm run deploy` | OpenNext build + `opennextjs-cloudflare deploy`. |
| `npm run sync:lib` | Idempotent — clone library if missing, install + build if missing. Called automatically by `preinstall` / `postinstall` / `predev` / `prebuild`. |
| `npm run sync:lib:pull` | `git pull` the library + force rebuild. Run this after someone pushes library changes you want to test. |
| `npm run sync:lib:build` | Force rebuild the library (no git pull). Run this after you edit library source locally. |

> The `build` script is `opennextjs-cloudflare build` (not `next build`) because Cloudflare's build step runs `npm run build` — and we need it to produce `.open-next/`, not just `.next/`. To prevent infinite recursion (OpenNext calling `npm run build` → `opennextjs-cloudflare build` → `npm run build` → ...), `open-next.config.ts` sets `buildCommand: 'next build'` so OpenNext calls `next build` directly instead of `npm run build`.

### Troubleshooting

**"Are you sure you want to proceed? wrangler deploy on a Pages project"** — you created a Pages project instead of a Workers project. OpenNext for Cloudflare deploys as a Worker, not a Pages site. Delete the Pages project and create a **Workers** project instead (Workers & Pages → Create → Workers → Connect to Git).

**`Could not find compiled Open Next config`** — the deploy command ran but `.open-next/.build/open-next.config.edge.mjs` doesn't exist. This means the build command only ran `next build` (producing `.next/`) instead of `opennextjs-cloudflare build` (producing `.open-next/`). Fix: make sure the `build` npm script is `opennextjs-cloudflare build` and the Cloudflare build command is `npm run build`.

**Build hangs / infinite loop** — if `open-next.config.ts` doesn't set `buildCommand: 'next build'`, OpenNext calls `npm run build` → `opennextjs-cloudflare build` → `npm run build` → forever. Fix: ensure `open-next.config.ts` has `buildCommand: 'next build'`.

**Build OOMs locally** — the OpenNext build needs ~4-6GB RAM. If your machine has less, use Cloudflare's build environment (8GB) instead of building locally. You can still develop locally with `npm run dev` (which doesn't run OpenNext).

## Network

All demos run on **Stellar Testnet**. Connect a wallet with Testnet funds — get test XLM from the [friendbot faucet](https://friendbot.stellar.org).

## Stack

- [Next.js 15](https://nextjs.org) (App Router, React 19)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) — runs Next.js on Cloudflare Workers
- [@saganta/stellar-appkit](https://github.com/sagantaHQ/stellar-appkit) — **linked locally** via `file:../stellar-appkit/packages/core` (currently v1.9.17)
- [@saganta/stellar-appkit-ui-web](https://github.com/sagantaHQ/stellar-appkit) — **linked locally** via `file:../stellar-appkit/packages/ui-web`
- [@saganta/stellar-appkit-siws-verify](https://github.com/sagantaHQ/stellar-appkit) — **linked locally** via `file:../stellar-appkit/packages/siws-verify`
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config, no `tailwind.config.js`)

## License

MIT
