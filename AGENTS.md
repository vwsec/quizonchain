# Quiz On Chain (quizonchain)

Next.js 15 (App Router) + React 19 quiz dApp. Players connect a wallet, answer 5
questions pulled per-session from a pre-generated pool (`data/quizzes-<chain>.json`),
scores are signed server-side (JWT + ECDSA trusted signer) and submitted on-chain to
Solidity contracts (Hardhat). Deployed on Vercel, multi-chain across 8 networks
(Ink, Soneium, Base, Unichain, MegaETH, LitVM, Arc, Sepolia).

## Dev environment
- Node + npm. `.npmrc` sets `legacy-peer-deps=true`; just run `npm install` (do NOT
  force `--legacy-peer-deps=false` — install fails otherwise).
- Required env vars (copy from `.env.local`): `QUIZ_JWT_SECRET`,
  `QUIZ_SIGNER_PRIVATE_KEY`, `PRIVATE_KEY`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
  Hardhat loads `.env` then `.env.local` (override) for `PRIVATE_KEY`/`QUIZ_SIGNER_PRIVATE_KEY`.
- `npm run dev` → http://localhost:3000 (`next dev --turbo`).

## Build & test
- `npm run build` / `npm run start` — Next build / start.
- `npm run lint` → `npx eslint .` (config ignores `.next`, `node_modules`).
- `npm run compile` → `TS_NODE_PROJECT=tsconfig.hardhat.json hardhat compile` (Solidity 0.8.27).
- `npm run deploy:sepolia` | `:mainnet` | `:minato` → runs `scripts/deploy.ts`.
- `npx hardhat run scripts/deploy-nft.ts --network sepoliaTestnet` — deploy QuizNFT.
- `npx hardhat verify --network sepoliaTestnet <ADDR> <TRUSTED_SIGNER>` — verify.
- `npm test` — contract tests (9 passing: QuizScores + QuizNFT). Bare `npx hardhat test` finds 0 files (config is `.cjs`, so TS discovery is off) — always use `npm test`.

## Conventions
- Path alias `@/*` → repo root (tsconfig `paths`). Layout: `app/` (routes +
  `*Content.tsx` client components), `components/` + `components/ui/` (shadcn,
  new-york style, lucide icons), `hooks/`, business logic in `lib/`.
- Quiz pool shape: `data/quizzes-<chain>.json` →
  `{ meta, quizzes: [{ question, options[4], correctIndex 0-3, id }] }`.
  `correctIndex` must stay ~25% balanced across 0-3 (cf. `rebalance.py` logic);
  questionsPerSession = 5.
- Contract addresses are exposed via TWO env-var conventions holding identical values:
  - Convention A (`_MAINNET` suffix): used by `lib/submitScore.ts`, `lib/chain-leaderboard.ts`.
  - Convention B (short chain name, e.g. `NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM`):
    used by `lib/active-chain-config.ts`.
  Keep both sets in sync when adding/changing a chain.
- Solidity: `pragma solidity ^0.8.27`, OpenZeppelin v5; contracts in `contracts/`,
  deploy scripts in `scripts/`. Chain → env-var mapping is in `scripts/deploy.ts`.

## Pitfalls
- **Contract tests exist** (9 passing: QuizScores + QuizNFT). Run via `npm test` — bare `npx hardhat test` finds 0 files (config is `.cjs`, TS discovery off).
- **`/api/*` is gated by `middleware.ts`**: blocked UAs include `claudebot`, `gptbot`,
  `curl`, `wget`, `python-requests`; non-allowlisted Origin/Referer (or none) → `444`/`403`.
  When testing API routes, send a browser-like UA + `localhost:3000` Origin, or call from the page.
- **`security-patches.patch`** contains required contract hardening (Pausable, cross-chain
  domain-separator fix, 2-step ownership transfer, `maxSupply` cap) marked "apply before deploy".
  `QuizScores.sol` already imports `Pausable`; verify the rest before any mainnet deploy.
- Editing only one of the two contract-address env conventions silently breaks a chain's
  score submission or leaderboard.
- `next.config.mjs` sets `images.unoptimized: true` and `productionBrowserSourceMaps: true`
  — expected, not bugs.

## Engineering discipline (Ponytail — always on)
Before writing code, stop at the first rung that holds:
1. Need to exist at all? (YAGNI — skip speculative work)
2. Already in this codebase? Reuse the existing helper/util/pattern.
3. Stdlib does it? Use it.
4. Native platform feature covers it? Use it.
5. Installed dependency solves it? Use it — never add a new one for a few lines.
6. One line? Make it one line.
7. Only then: minimum code that works.

Understand the problem first (read the code it touches, trace the real flow), then climb.
Bug fix = root cause, not symptom: grep every caller, fix the shared function once.
Never simplify away: trust-boundary validation, error handling that prevents data loss,
**security** (esp. `app/api/sign-score` + `app/api/generate-quiz`), accessibility, or
anything explicitly requested. Mark deliberate simplifications cutting a real corner with a
`// ponytail:` comment naming the ceiling + upgrade path. Intensity: `ponytail lite|full|ultra`
(default full); `stop ponytail` to exit.
