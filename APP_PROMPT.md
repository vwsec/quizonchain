# Quiz On Chain — AI-Readable Prompt Document

## 1. Overview

**Quiz On Chain** is a multi-chain Web3 quiz dApp where users answer blockchain trivia questions (5 per round), submit scores on-chain, and mint an NFT (ERC-721, "The What of Blockchain" / "TWOB") when they reach 100 total points.

The app targets **five L2 networks** but can operate in single-chain mode via env var:
- Soneium (1868)
- Ink (57073)
- Base (8453)
- Unichain (130)
- MegaETH (4326)

**Stack:** Next.js 15 (App Router, React 19, Turbopack), TypeScript 6.0, Tailwind CSS v4, Viem 2.x, Wagmi 3.x, RainbowKit 2.x, TanStack Query 5, Hardhat 3.x, Solidity 0.8.24, OpenZeppelin 5.6, Groq SDK (Llama 3.3 70B), Jina Reader, `jose` (JWT), Zod 4, Framer Motion, Recharts, `@vercel/analytics`.

---

## 2. Architecture

```
User Browser
    │
    ├── RainbowKit (wallet connect, chain switching)
    ├── Wagmi (contract reads/writes via Viem)
    ├── TanStack Query (leaderboard, quiz data, explorer)
    └── localStorage (quiz answers, cooldown state, Telegram prefs)
            │
            ▼
Next.js App Router (single deployment)
    │
    ├── /api/generate-quiz  → Jina Reader → Groq → JWT (jose)
    ├── /api/sign-score     → JWT verify → EIP-191 sign (server-side key)
    ├── /api/verify-quiz    → JWT verify, return calculated score
    └── /api/telegram       → proxy to Telegram Bot API
            │
            ▼
Smart Contracts (deployed per chain, linked by env vars)
    ├── QuizScores.sol  — score ledger, EIP-191 sig verification, leaderboard
    └── QuizNFT.sol     — ERC-721, direct user minting, threshold check via staticcall
            │
            ▼
Public RPCs (from lib/chains.ts)
    Soneium, Ink, Base, Unichain, MegaETH
```

**Key design decisions:**
- Single Next.js instance serves all chains; `NEXT_PUBLIC_ACTIVE_CHAIN` env var controls single vs multi-chain mode.
- If `NEXT_PUBLIC_ACTIVE_CHAIN` is unset → multi-chain (all 5 chains active via RainbowKit).
- If set → single-chain mode (only that chain's config used).
- JWT is signed server-side at quiz generation, verified server-side at score signing — prevents score tampering.
- Gas is paid by the **user's wallet** (not a gas tank). The server provides an EIP-191 signature that the user submits with their own `writeContract` call.
- The server-side signer (controlled by `QUIZ_SIGNER_PRIVATE_KEY`) signs the score payload; the contract verifies against `trustedSigner`.
- Leaderboard uses `QuizScores.getLeaderboard()` (on-chain view) aggregated across chains.
- 5 questions per quiz round; 1-hour cooldown between submissions (contract-enforced, adjustable by owner).
- NFT is minted directly by the user when their `totalPoints >= pointsThreshold` (100 in deploy config).

---

## 3. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | — | WalletConnect Cloud project ID |
| `GROQ_API_KEY` | Yes | — | Groq API key for Llama 3.3 70B quiz generation |
| `QUIZ_JWT_SECRET` | No | `GROQ_API_KEY` or `"dev-insecure-quiz-secret"` | JWT signing secret for quiz tokens |
| `QUIZ_SIGNER_PRIVATE_KEY` | Yes* | — | Private key of the EIP-191 trusted signer (server-side) |
| `PRIVATE_KEY` | Deploy only | — | Deployer wallet private key (Hardhat scripts) |
| `NEXT_PUBLIC_ACTIVE_CHAIN` | No | unset (multi-chain) | Single-chain mode: `"ink"`, `"soneium"`, `"base"`, `"unichain"`, `"megaeth"` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM` | Yes | — | QuizScores address on Soneium |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_INK` | Yes | — | QuizScores address on Ink |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_BASE` | Yes | — | QuizScores address on Base |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN` | Yes | — | QuizScores address on Unichain |
| `NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH` | Yes* | — | QuizScores address on MegaETH |
| `NEXT_PUBLIC_NFT_CONTRACT_SONEIUM` | Yes | — | QuizNFT address on Soneium |
| `NEXT_PUBLIC_NFT_CONTRACT_INK` | Yes | — | QuizNFT address on Ink |
| `NEXT_PUBLIC_NFT_CONTRACT_BASE` | Yes | — | QuizNFT address on Base |
| `NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN` | Yes | — | QuizNFT address on Unichain |
| `NEXT_PUBLIC_NFT_CONTRACT_MEGAETH` | Yes* | — | QuizNFT address on MegaETH |
| `SIGNER_PRIVATE_KEY` | No | — | Fallback for `QUIZ_SIGNER_PRIVATE_KEY` |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | CORS origin allowlist |

**Validation:** `lib/env-validation.ts` logs debug warnings for missing/invalid contract address env vars at runtime. Critical vars (`WALLETCONNECT_PROJECT_ID`) throw at provider init.

---

## 4. File-by-File Documentation

### 4.1 Root Configuration

#### `next.config.mjs`
- CSP: `default-src 'self'`, `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' blob: data: https://*.walletconnect.com https://*.walletconnect.org`, `connect-src` includes all 5 chain RPCs and block explorer APIs, `block-all-mixed-content`, `upgrade-insecure-requests`.
- Security headers: HSTS (1 year), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection.
- `typescript.ignoreBuildErrors: true` — bypass TS errors at build time.
- `images.unoptimized: true` — no Next.js image optimization (static exports friendly).
- No rewrites (no Etherscan proxy).
- `poweredByHeader: false`.

#### `hardhat.config.ts`
- Solidity 0.8.24, optimizer enabled (200 runs).
- 6 networks: `soneiumMinato` (testnet, 1946), `soneiumMainnet` (1868), `inkonchain` (57073), `baseMainnet` (8453), `unichainMainnet` (130), `megaethMainnet` (4326).
- All use `PRIVATE_KEY` env var for deployer accounts.
- Etherscan verification configured for all 5 mainnets with custom chain definitions (API URLs: explorer-native APIs or Blockscout).

#### `package.json`
- Key scripts: `dev` (Turbopack), `build`, `start`, `lint`, `compile` (`TS_NODE_PROJECT=tsconfig.hardhat.json hardhat compile`), `deploy:minato`, `deploy:mainnet`.
- Dependencies: `next@^15`, `react@^19`, `viem@^2.48`, `wagmi@^3.6`, `@rainbow-me/rainbowkit@^2.2`, `@tanstack/react-query@^5`, `jose@^6`, `groq-sdk`, `zod@^4`, `framer-motion`, `recharts`, `lucide-react`, `sonner`, `@vercel/analytics`.
- Dev: `hardhat@^3.3`, `@nomicfoundation/hardhat-toolbox@^5`, `ethers@^6`, `typescript@^6`, `tailwindcss@^4`, `dotenv`.

#### `tsconfig.json`
- Path aliases: `@/*` → `./*`.
- JSX: `preserve` (handled by Next.js).
- Module: `ESNext`, ModuleResolution: `bundler`.

#### `postcss.config.mjs`
- `@tailwindcss/postcss` (Tailwind CSS v4, no config file needed).

#### `.env.local`
- All env vars set here; not committed.

#### `.gitignore`
- Ignores `node_modules`, `.env`, `.env.local`, `next-env.d.ts`, `cache`, `artifacts`, `typechain-types`.

---

### 4.2 Smart Contract Scripts (`/scripts`)

#### `deploy.ts`
- Deploys `QuizScores` to the current Hardhat network.
- Reads `QUIZ_SIGNER_PRIVATE_KEY` to compute the `trustedSigner` address (passed to constructor).
- Outputs the deployed address and the corresponding env var name to set.
- Chain-to-env-var mapping: `{1868: NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM, 57073: ...INK, 8453: ...BASE, 130: ...UNICHAIN, 4326: ...MEGAETH}`.
- Usage: `TS_NODE_PROJECT=tsconfig.hardhat.json hardhat run scripts/deploy.ts --network soneiumMainnet`.

#### `deploy-nft.ts`
- Deploys `QuizNFT` to the current network.
- Reads the QuizScores address from the corresponding `NEXT_PUBLIC_CONTRACT_ADDRESS_*` env var.
- Sets base URI per chain (e.g. `https://quizonchain.com/nft/soneium`).
- Uses threshold of 100 points.
- Outputs the NFT address and the corresponding `NEXT_PUBLIC_NFT_CONTRACT_*` env var.
- Usage: same pattern as deploy.ts.

#### `update-base-uri.ts` / `fetch-docs-pages-jina.ts`
- Not present in this codebase. The docs pages TS constants are defined directly in `lib/docsPages.ts` and can be regenerated manually.

---

### 4.3 Library Modules (`/lib`)

#### `chains.ts`
- Defines 5 chain objects using `viem`'s `defineChain()`:
  - `inkMainnet` (57073), `soneiumMainnet` (1868), `base` (8453, re-exported from `wagmi/chains`), `unichain` (130), `megaEth` (4326).
- Each has `rpcUrls.default.http`, `blockExplorers.default`, `nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }`.
- Exports `soneiumChains` array (all 5) and `getSoneiumChainById(chainId)` lookup.
- Exports `getTxInternalUrl(chainId, txHash)` → `/explorer/{slug}/tx/{hash}` and `getTxExplorerUrl(chainId, txHash)` → external block explorer URL.

#### `active-chain-config.ts`
- Defines `CHAIN_CONFIGS` record with 5 keys: `ink`, `soneium`, `base`, `unichain`, `megaeth`.
- Each config includes: `name`, `chainId`, `color`, `rpc`, `explorer`, `blockscoutApi`, `contractAddress`, `nftContract`, `docsPages` (URLs), `heroTitle`, `heroSubtitle`, `heroLabel`, `nftMetadataPath`, `nftImage`.
- Reads `NEXT_PUBLIC_ACTIVE_CHAIN` env var → `activeChainKey` (defaults to `"ink"` if invalid/unset).
- Exports `activeChainConfig` (current chain config) and `isMultiChain` (true when `NEXT_PUBLIC_ACTIVE_CHAIN` is unset).

#### `submitScore.ts`
- Defines `quizScoresAbi` (inline ABI for `submitScore`, `nonces`, `getTimeUntilNextSubmission`, `getLeaderboard`, `totalPoints`, `totalGames`, `ScoreSubmitted` event).
- Exports types: `SubmitScoreResult`, `SubmitScoreSuccess`, `SubmitScoreFailure`.
- **`getContractAddress(chainId)`**: resolves the QuizScores contract address from env vars per chain. Includes full list with MegaETH support.
- **`getViemChain(chainId)`**: maps chain ID to the Viem chain object.
- **`validateScoreInputs(score, total)`**: validates score range (0-255).
- **`fetchScoreSignature(playerAddress, score, total, nonce, chainId, contractAddress, quizToken?, userAnswers?)`**: calls `POST /api/sign-score` to get an EIP-191 signature from the server-side signer.
- **`getTimeUntilNextSubmissionSeconds(params)`**: reads the on-chain cooldown timer.
- **`estimateSubmitScoreGas(params)`**: estimates gas for `submitScore` with a placeholder 65-byte signature.
- **`useSubmitScore()`** (React hook): orchestrates the full submission flow:
  1. Validates inputs.
  2. Resolves contract address per chain.
  3. Reads on-chain nonce.
  4. Fetches server-side signature via `fetchScoreSignature`.
  5. Calls `walletClient.writeContract` (user pays gas).
  6. Waits for tx receipt.
  7. Returns `{ success, hash }` or `{ success, error }`.

#### `leaderboard.ts`
- **`fetchGlobalLeaderboard()`**: fetches leaderboards from 4 chains (Ink, Soneium, Base, Unichain) in parallel using `Promise.allSettled`.
- For each chain: creates a Viem public client, calls `getLeaderboard()` (returns `[addrs[], points[], games[]]`).
- Merges across chains by lowercase address, summing points and games, collecting chain names.
- Computes `avg = (points / (games * 5)) * 100`.
- Sorts by total points descending, assigns ranks.
- Returns `{ players: GlobalPlayer[], failedChains: string[] }`.

#### `chain-leaderboard.ts`
- **`getChainLeaderboard(chainConfig)`**: fetches leaderboard for a single chain with retry logic.
- Used for per-chain leaderboard views.

#### `nft-contracts.ts`
- `NFT_CONTRACTS` record mapping chain IDs to NFT contract addresses (from `NEXT_PUBLIC_NFT_CONTRACT_*` env vars).
- `NFT_ABI`: minimal ABI with `mint()`, `canMint(address)`, `hasMinted(address)`, `totalMinted()`.

#### `quiz-data.ts`
- Exports `Question` interface `{ id, question, options, correctIndex }`.
- Exports `quizQuestions` array (5 static questions about Soneium) — used as fallback/hardcoded quiz data.

#### `docsPages.ts`
- Exports 5 arrays: `SONEIUM_DOCS_PAGES`, `INK_DOCS_PAGES`, `BASE_DOCS_PAGES`, `UNICHAIN_DOCS_PAGES`, `MEGAETH_DOCS_PAGES`.
- Each contains documentation URLs for Jina Reader to scrape at quiz generation time.
- Manually curated; can be regenerated via `npm run test:docs-jina`.

#### `telegram.ts`
- **`sendTelegramMessage(botToken, chatId, message)`**: sends a message via the local `/api/telegram` proxy.
- **`formatTxAlertMessage(tx, network, explorerBase)`**: formats a transaction alert for Telegram (HTML parse mode) with value, addresses, and explorer link.

#### `safe-storage.ts`
- `safeStorage` object: `{ get, set, remove }` — wraps `localStorage` with SSR safety (`typeof window === 'undefined'` check) and try/catch for quota errors.
- Note: the main storage polyfill is in `app/providers.tsx` (Map-based global override for non-Storage environments).

#### `utils.ts`
- `cn(...inputs)`: `clsx` + `tailwind-merge` utility.
- `pickRandom(arr, n)`: Fisher-Yates shuffle via `sort(() => Math.random() - 0.5)`, returns `n` elements.

#### `env-validation.ts`
- Validates contract address env vars only: `NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET`, `_INK_MAINNET`, `_BASE_MAINNET`, `_UNICHAIN`.
- Uses `viem.isAddress()` for validation.
- Logs debug warnings for missing/invalid — does **not** throw.

---

### 4.4 App Pages & Layouts (`/app`)

#### `layout.tsx`
- Root layout with Geist Sans/Mono fonts, metadata (dynamic per active chain: "Quiz On Ink", "Quiz On Soneium", etc.).
- Conditional OpenGraph `base:app_id` and `base:builder_code` for Base chain.
- Body classes: `theme-megaeth`, `theme-ink`, `theme-unichain`, `theme-base` per active chain.
- Wraps in `<Providers>` → `<WalletProvider>` → `<ThemeBackground>` → `<Header>`.
- Includes `<Toaster>` (sonner) and Vercel `<Analytics>` in production.

#### `providers.tsx`
- Client component (`"use client"`).
- **localStorage polyfill**: at module scope, checks if `globalThis.localStorage` has full `Storage` shape (`getItem`, `setItem`, `removeItem`, `clear`). If not, replaces it with a `Map<string, string>`-backed implementation. This prevents WalletConnect crashes in SSR/non-browser runtimes.
- Creates Wagmi config via `getDefaultConfig()`:
  - Multi-chain: all 5 chains.
  - Single-chain: only the active chain's config.
- RainbowKit `darkTheme` with chain-specific accent color.
- TanStack Query `QueryClient`.
- Calls `validateContractAddressEnv()` on mount.

#### `globals.css`
- Tailwind CSS v4 `@import "tailwindcss"`.
- `@custom-variant dark (&:is(.dark *))`.
- RainbowKit CSS variables overrides.
- Theme classes for chain-specific backgrounds (`.theme-megaeth`, `.theme-ink`, etc.).

#### `page.tsx` + `HomeContent.tsx` (in `app/`)
- Home page with quiz start CTA, chain branding from `activeChainConfig`.

#### `leaderboard/page.tsx` + `LeaderboardContent.tsx` (in `app/leaderboard/`)
- Tabbed leaderboard: per-chain tabs + global tab.
- Fetches data client-side via TanStack Query → server API.

#### `explorer/` pages
- Chain overview, address details, transaction details.
- Uses Blockscout API (configured per chain in `CHAIN_CONFIGS`).

#### `docs/page.tsx` + `DocsContent.tsx` (in `app/docs/`)
- Displays documentation pages from `DOCS_PAGES` arrays in expandable cards.

#### `support/page.tsx` + `SupportContent.tsx` (in `app/support/`)
- Support page with Telegram alerts toggle, email link, docs links.

---

### 4.5 API Routes (`/app/api`)

#### `generate-quiz/route.ts` (`GET` | `POST /api/generate-quiz`)

- **Input (body)**: `{ chainId?: number }` (Zod-validated).
- **Rate limiting**: in-memory `Map<IP, { count, resetTime }>`, 5 requests per 60 seconds per IP.
- **CORS**: `Access-Control-Allow-Origin` set to `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`). Returns 403 for unlisted origins.
- **Flow**:
  1. Resolves chain → ecosystem config (Ink, Soneium, Base, Unichain).
  2. Picks up to 6 docs URLs via Fisher-Yates.
  3. Fetches content via Jina Reader (`https://r.jina.ai/<url>`) with 35s timeout and 1s delay between fetches.
  4. Validates scraped content (≥300 chars, no error signals).
  5. If content insufficient → returns fallback questions (hardcoded per ecosystem).
  6. Calls Groq (`llama-3.3-70b-versatile`) with strict JSON prompt (up to 3 retries with exponential backoff).
  7. Parses and validates model output (5 questions × 4 options, Zod schema).
  8. Shuffles questions via Fisher-Yates.
  9. Signs the correct answers as JWT (`jose.SignJWT`, HS256, 15 min TTL).
  10. Returns `{ questions, quizToken, sources, usedFallbackQuestions, ecosystem }`.

- **JWT secret resolution**: `QUIZ_JWT_SECRET` → `GROQ_API_KEY` → `"dev-insecure-quiz-secret"`.
- **Max body size**: 10 KB.
- **Edge cases**: Returns fallback questions on any error (Groq failure, Jina failure, parse failure).

#### `sign-score/route.ts` (`POST /api/sign-score`)

- **Input body** (Zod): `{ playerAddress, score, total, nonce, chainId, contractAddress, quizToken?, answers? }`.
- **Rate limiting**: same Map pattern, 5/min per IP.
- **Flow**:
  1. Validates addresses via `viem.isAddress()`.
  2. If `quizToken` and `answers` provided → verifies JWT, recalculates score server-side, rejects on mismatch.
  3. In production, `quizToken` is **required** (returns 403 if missing).
  4. In development, `quizToken` is optional (allows testing without JWT).
  5. Loads signer key from `QUIZ_SIGNER_PRIVATE_KEY` or `SIGNER_PRIVATE_KEY`.
  6. Encodes `[playerAddress, score, total, nonce, chainId, contractAddress]` via `encodeAbiParameters` (matches Solidity `abi.encode`).
  7. Computes `keccak256(encoded)` and signs with `account.signMessage({ raw: toBytes(digest) })` (produces EIP-191 signed message).
  8. Returns `{ signature, trustedSigner }`.

- **Does not submit on-chain**. Returns only the signature; the client calls `walletClient.writeContract` with the signature.

#### `verify-quiz/route.ts` (`POST /api/verify-quiz`)

- **Input body** (Zod): `{ quizToken, answers }` (array of 5 numbers 0-3).
- **Flow**:
  1. Verifies JWT via `jose.jwtVerify`.
  2. Compares `answers` against JWT payload's `answers`.
  3. Returns `{ score }` (number of correct answers, 0-5).
- Used client-side for score preview before submission.

#### `telegram/route.ts` (`POST /api/telegram`)

- **Input**: `{ botToken, chatId, message }`.
- **Flow**: forwards to `https://api.telegram.org/bot<token>/sendMessage` with `parse_mode: HTML`.
- **No authentication** — acts as a simple CORS-safe proxy to avoid exposing the bot token client-side.

---

### 4.6 Components (`/components`)

#### `header.tsx`
- Sticky header: logo, nav links (Quiz, Leaderboard, Explorer, Docs, Support), RainbowKit `ConnectButton`.
- Mobile responsive (sheet drawer).

#### `theme-background.tsx`
- Dynamic background gradient based on active chain's brand color.

#### `wallet-provider.tsx`
- Custom wrapper for RainbowKit connect button styling and error boundaries.

#### Other components (in `/components`):
- `home-screen.tsx`, `quiz-screen.tsx`, `results-screen.tsx` — quiz flow screens.
- `leaderboard.tsx` — leaderboard table (TanStack Query, chain tabs, auto-refresh).
- `nft-mint.tsx` — NFT mint UI (checks `canMint`, triggers `mint()`).
- `bubble-explorer.tsx` — animated background bubbles.
- `transaction-status.tsx` — tx status display with explorer link.
- `explorer-back-button.tsx` — back navigation in explorer pages.
- `telegram-alerts-modal.tsx` — Telegram subscription dialog.
- Chain logos: `base-logo.tsx`, `ink-logo.tsx`, `megaeth-logo.tsx`, `soneium-logo.tsx`, `unichain-logo.tsx`.

#### UI primitives (`/components/ui/`):
- Full set of shadcn/ui components (button, card, dialog, dropdown-menu, input, label, select, separator, sheet, skeleton, sonner, table, tabs, textarea, toast, tooltip, accordion, alert-dialog, avatar, checkbox, collapsible, context-menu, hover-card, menubar, navigation-menu, popover, progress, radio-group, scroll-area, slider, switch, toggle, toggle-group).

#### Hooks (`/hooks/`):
- `use-telegram-alerts.ts` — Telegram alert preferences (localStorage).
- `use-mobile.ts` — viewport detection.
- `use-toast.ts` — shadcn toast helper.

---

### 4.7 Public Assets (`/public`)

- `/nft/` — per-chain NFT images: `base.png`, `ink.png`, `megaeth.png`, `soneium.png`, `unichain.png`, with subdirectories for token-specific images.
- `logo.png`, `favicon.ico`, `og-image.png`.
- Background images, chain icons.

---

## 5. Smart Contracts

### 5.1 QuizScores.sol (v1 — single contract per chain)

**Solidity:** 0.8.24, uses OpenZeppelin `ReentrancyGuard`, `Ownable`, `ECDSA`, `MessageHashUtils`.

**State:**
```solidity
struct Score { uint8 score; uint8 total; uint256 timestamp; }
mapping(address => Score) public scores;
mapping(address => uint256) public lastSubmissionAt;
mapping(address => uint256) public nonces;
uint256 public cooldownPeriod = 1 hours;    // default 1 hour
uint8 public maxTotal = 5;                  // 5 questions per quiz
address public trustedSigner;               // EIP-191 signer
address[] public players;
mapping(address => bool) public hasPlayed;
mapping(address => uint256) public totalPoints;
mapping(address => uint256) public totalGames;
```

**Constructor:** `constructor(address initialTrustedSigner)` — sets `trustedSigner`, `Ownable(msg.sender)`.

**Key functions:**

| Function | Description |
|---|---|
| `submitScore(uint8 score, uint8 total, bytes calldata sig)` | Called by user (msg.sender). Checks cooldown, verifies EIP-191 signature (signed by `trustedSigner`), updates score/totalPoints/games. |
| `setCooldownPeriod(uint256 newCooldown)` | Owner-only. Valid range: 5 min – 24 hours. |
| `setTrustedSigner(address newSigner)` | Owner-only. Updates the EIP-191 signer address. |
| `setMaxTotal(uint8 newMaxTotal)` | Owner-only. Valid range: 1-20. |
| `clearScore(address player)` | Owner-only. Deletes player's score data. |
| `getScore(address player) → Score` | View. Returns player's latest Score struct. |
| `getLeaderboard() → (address[], uint256[], uint256[])` | View. Returns all players' addresses, total points, and total games. |
| `getTimeUntilNextSubmission(address) → uint256` | View. Returns 0 if cooldown expired, else seconds remaining. |

**Events:** `ScoreSubmitted`, `CooldownUpdated`, `CooldownPeriodUpdated`, `TrustedSignerUpdated`, `MaxTotalUpdated`, `ScoreCleared`.

**Signature verification** (`_isValidSignature`, internal):
```solidity
bytes32 digest = keccak256(
    abi.encode(player, score, total, nonces[player], block.chainid, address(this))
).toEthSignedMessageHash();
return digest.recover(sig) == trustedSigner;
```

**Security:**
- EIP-191 signature verified on-chain before accepting any score.
- Prevents replay by including `nonces[player]`, `block.chainid`, and `address(this)` in the signed digest.
- Cooldown prevents rapid submissions.
- `ReentrancyGuard` on `submitScore`.

### 5.2 QuizNFT.sol (ERC-721URIStorage)

**Solidity:** 0.8.24, inherits `ERC721URIStorage`, `Ownable`, `ReentrancyGuard`.

**Token:** Name: `"The What of Blockchain"`, Symbol: `"TWOB"`.

**State:**
```solidity
uint256 public totalMinted;
string public baseTokenURI;
address public quizScoresContract;
uint256 public pointsThreshold;
mapping(address => bool) public hasMinted;
```

**Constructor:** `constructor(address _quizScoresContract, string memory _baseTokenURI, uint256 _pointsThreshold)`.

**Key functions:**

| Function | Description |
|---|---|
| `mint()` | Called by user (msg.sender). Checks `!hasMinted`, checks `_hasReachedThreshold(msg.sender)`. Mints token with URI `{baseTokenURI}/{tokenId}.json`. |
| `canMint(address player) → bool` | View. Returns `!hasMinted && _hasReachedThreshold`. |
| `getPoints(address player) → uint256` | View. Static-calls `QuizScores.totalPoints(player)`. |
| `setBaseTokenURI(string)` | Owner-only. |
| `setPointsThreshold(uint256)` | Owner-only. |
| `setQuizScoresContract(address)` | Owner-only. |

**Threshold check** (`_hasReachedThreshold`, internal):
```solidity
(bool success, bytes memory data) = quizScoresContract.staticcall(
    abi.encodeWithSignature("totalPoints(address)", player)
);
if (!success || data.length == 0) return false;
return abi.decode(data, (uint256)) >= pointsThreshold;
```

**Events:** `NFTMinted`, `BaseURIUpdated`, `ThresholdUpdated`, `QuizContractUpdated`.

**Security:**
- Mint is gated by an external call to `QuizScores.totalPoints()` — no role/only modifier needed, just the threshold check.
- `hasMinted` prevents double-mints.
- `ReentrancyGuard` on `mint`.

---

## 6. Data Flows

### 6.1 Quiz Generation → Submission → On-Chain Score

```
User clicks "Start Quiz"
    │
    ▼
POST /api/generate-quiz  { chainId }
    ├── Rate limit check (5/min per IP)
    ├── Jina Reader → fetch chain docs (up to 6 URLs)
    ├── Groq → generate 5 Q&A (Llama 3.3 70B)
    ├── JWT sign { answers: number[], chainId, type: "quiz-answers" } (15 min TTL)
    └── Return { questions (no correct answers), quizToken (JWT), sources, ecosystem }
    │
    ▼
User answers 5 questions
    │
    ▼
POST /api/verify-quiz  { quizToken, answers }
    ├── Verify JWT
    ├── Compare answers → compute score (0-5)
    └── Return { score }  (preview for user)
    │
    ▼
User confirms → useSubmitScore() hook
    ├── Read on-chain nonce for user
    ├── POST /api/sign-score { playerAddress, score, total, nonce, chainId, contractAddress, quizToken, answers }
    │   ├── Verify JWT, recalculate score server-side
    │   ├── encodeAbiParameters([player, score, total, nonce, chainId, contract])
    │   ├── keccak256 → EIP-191 sign with QUIZ_SIGNER_PRIVATE_KEY
    │   └── Return { signature, trustedSigner }
    ├── walletClient.writeContract({
    │     address: contractAddress,
    │     abi: quizScoresAbi,
    │     functionName: 'submitScore',
    │     args: [score, total, signature]
    │   })  ← User pays gas
    └── Wait for tx receipt → return { success, hash }
    │
    ▼
Transaction mined: QuizScores.submitScore
    ├── Verify EIP-191 signature (ECDSA.recover → trustedSigner)
    ├── Check cooldown (lastSubmissionAt + cooldownPeriod)
    ├── Update scores, totalPoints, totalGames
    └── Emit ScoreSubmitted
    │
    ▼
Leaderboard reflects new score on next poll
```

### 6.2 NFT Mint Flow

```
User has totalPoints >= pointsThreshold (100)
    │
    ▼
User navigates to NFT mint page
    │
    ▼
Check canMint(address) → QuizNFT contract
    ├── !hasMinted[user]
    └── staticcall QuizScores.totalPoints(user) >= pointsThreshold
    │
    ▼
User clicks "Mint NFT"
    │
    ▼
walletClient.writeContract({
    address: nftContractAddress,
    abi: NFT_ABI,
    functionName: 'mint',
    args: []
})  ← User pays gas
    │
    ▼
Transaction mined: QuizNFT.mint
    ├── Check !hasMinted[msg.sender]
    ├── staticcall QuizScores.totalPoints(msg.sender)
    ├── totalMinted++ → tokenId
    ├── _safeMint(msg.sender, tokenId)
    ├── _setTokenURI(tokenId, "{baseTokenURI}/{tokenId}.json")
    └── Emit NFTMinted
```

### 6.3 Cross-Chain Leaderboard

```
fetchGlobalLeaderboard()
    │
    ├── For each of 4 chains (Ink, Soneium, Base, Unichain):
    │   ├── createPublicClient(chain)
    │   └── readContract(getLeaderboard, quizScoresAbi)
    │       → [addrs[], points[], games[]]
    │
    ├── Merge by lowercase address across chains
    │   → Map<address, { points, games, chains[] }>
    │
    ├── Sort by total points desc
    ├── Assign ranks (1-based)
    └── Return { players: GlobalPlayer[], failedChains: string[] }
```

### 6.4 Single vs Multi-Chain Mode

- **Multi-chain** (default, no env var): All 5 chains in RainbowKit, user switches wallet chain.
- **Single-chain** (`NEXT_PUBLIC_ACTIVE_CHAIN=ink`): Only that chain's config used. RainbowKit shows only that chain. `isMultiChain = false`.
- Contract address resolution uses `env-vars.ts` per-chain vars.

---

## 7. Security Model

### 7.1 JWT Authentication (Quiz Integrity)
- Quiz correct answers are embedded in a JWT signed server-side at generation time.
- The client never receives the correct answers — only the questions and shuffled options.
- At score submission, the JWT is sent to `/api/sign-score` where it is verified and the score is recalculated server-side.
- JWT secret: `QUIZ_JWT_SECRET || GROQ_API_KEY || "dev-insecure-quiz-secret"`.
- JWT expiry: 15 minutes (`QUIZ_TOKEN_TTL_SECONDS = 900`).

### 7.2 EIP-191 Signature (Score Authenticity)
- The server-side signer (`QUIZ_SIGNER_PRIVATE_KEY`) signs `[playerAddress, score, total, nonce, chainId, contractAddress]` (keccak256 + EIP-191).
- The contract verifies the signature against `trustedSigner` (set at deployment via `deploy.ts`).
- Includes `nonces[player]`, `block.chainid`, `address(this)` in the signed payload → prevents replay across chains or address reuse.

### 7.3 Rate Limiting
- **API routes**: In-memory `Map<IP, { count, resetTime }>`, 5 requests per 60 seconds per IP. Resets on server restart.
- **On-chain**: `cooldownPeriod` (default 1 hour) enforced in `QuizScores.submitScore`.
- **CORS**: Only `NEXT_PUBLIC_APP_URL` origin allowed (returns 403 for unknown origins).

### 7.4 On-Chain Security
- `submitScore` is `nonReentrant` (OpenZeppelin `ReentrancyGuard`).
- Owner-only functions: `setCooldownPeriod`, `setTrustedSigner`, `setMaxTotal`, `clearScore`.
- NFT mint gated by threshold check (staticcall to QuizScores), plus `hasMinted` guard.
- Contract ownership should be transferred to a multisig for production.

### 7.5 Infrastructure Security
- No gas tank — users pay their own transaction fees.
- `QUIZ_SIGNER_PRIVATE_KEY` and `GROQ_API_KEY` are server-side only (never exposed to client).
- CSP blocks unauthorized script execution and external resources.
- HSTS enabled (1 year, includeSubDomains, preload).
- X-Frame-Options: SAMEORIGIN (prevents clickjacking).

### 7.6 Admin Access
- Contract ownership held by deployer address (set by `PRIVATE_KEY` in Hardhat config).
- `trustedSigner` is a separate key (`QUIZ_SIGNER_PRIVATE_KEY`) used for daily operations (signing scores).
- The signer key can be rotated via `setTrustedSigner()` (owner-only).

---

## 8. Deployment

### 8.1 Prerequisites
- Node.js >= 18, npm/pnpm.
- WalletConnect Cloud project ID (free tier, set to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`).
- Groq API key (`GROQ_API_KEY`).
- EOA private keys: `PRIVATE_KEY` (deployer) and `QUIZ_SIGNER_PRIVATE_KEY` (score signer).

### 8.2 Contract Deployment
```bash
# Install & compile
npm install
npm run compile   # TS_NODE_PROJECT=tsconfig.hardhat.json hardhat compile

# Deploy QuizScores per chain
TS_NODE_PROJECT=tsconfig.hardhat.json hardhat run scripts/deploy.ts --network soneiumMainnet
TS_NODE_PROJECT=tsconfig.hardhat.json hardhat run scripts/deploy.ts --network inkonchain
# ... repeat for baseMainnet, unichainMainnet, megaethMainnet

# Set env vars from deploy output:
# NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM, _INK, _BASE, _UNICHAIN, _MEGAETH

# Deploy QuizNFT per chain
TS_NODE_PROJECT=tsconfig.hardhat.json hardhat run scripts/deploy-nft.ts --network soneiumMainnet
# ... repeat for each chain

# Set env vars:
# NEXT_PUBLIC_NFT_CONTRACT_SONEIUM, _INK, _BASE, _UNICHAIN, _MEGAETH

# Verify contracts (uses hardhat-verify with custom chain configs)
TS_NODE_PROJECT=tsconfig.hardhat.json hardhat verify --network inkonchain <QUIZ_SCORES_ADDR> <TRUSTED_SIGNER_ADDR>
TS_NODE_PROJECT=tsconfig.hardhat.json hardhat verify --network inkonchain <NFT_ADDR> <SCORES_ADDR> <BASE_URI> 100
```

### 8.3 Frontend Deployment (Vercel)
```bash
npm run build
vercel --prod
```
- Set all env vars in Vercel Project Settings.
- `NEXT_PUBLIC_ACTIVE_CHAIN` — leave unset for multi-chain, or set to a specific chain.
- `NEXT_PUBLIC_APP_URL` — set to the production domain (for CORS origin validation).

### 8.4 Post-Deployment
- Verify contracts on block explorers.
- Test full quiz flow on each chain.
- Monitor leaderboard data.
- Ensure `QUIZ_SIGNER_PRIVATE_KEY` wallet has no funds (it only signs, never pays gas).

---

## 9. Gotchas & Known Issues

1. **`tsconfig.json` vs `tsconfig.hardhat.json`**: Hardhat requires CJS/Node resolution; Next.js uses bundler module resolution. Hardhat scripts must use `TS_NODE_PROJECT=tsconfig.hardhat.json` prefix. The main `tsconfig.json` has `moduleResolution: "bundler"` which breaks Hardhat.

2. **localStorage polyfill in `providers.tsx`**: RainbowKit/WalletConnect may call `localStorage.getItem` during SSR or in edge runtimes. The module-scope polyfill replaces `globalThis.localStorage` with a Map-backed implementation if the native one isn't a full `Storage` instance. This runs at import time, before any component mounts.

3. **JWT secret fallback chain**: `QUIZ_JWT_SECRET` → `GROQ_API_KEY` → `"dev-insecure-quiz-secret"`. The raw fallback is **insecure** — always set `QUIZ_JWT_SECRET` in production. Changing `GROQ_API_KEY` invalidates all existing quiz JWTs if `QUIZ_JWT_SECRET` is not set.

4. **CORS origin validation**: Both `generate-quiz` and `sign-score` validate `Origin` header against `NEXT_PUBLIC_APP_URL` and return 403 for unknown origins. Ensure `NEXT_PUBLIC_APP_URL` is set in production.

5. **In-memory rate limiting**: Resets on every server restart/scale. For production with multiple instances, replace with Redis or a database. The Map is keyed by IP (via `x-forwarded-for` header — relies on reverse proxy trust).

6. **No gas tank**: Users pay their own gas for `submitScore` and `mint`. On L2s with low fees this is negligible (~$0.01). Ensure the signer private key has no funds (it never submits transactions).

7. **QuizScores contract has no per-chain mapping**: Each chain has its **own** QuizScores deployment (separate address, separate state). The cross-chain leaderboard aggregates via API calls to all chain RPCs.

8. **MegaETH not in global leaderboard**: `fetchGlobalLeaderboard()` only queries 4 chains (Ink, Soneium, Base, Unichain). MegaETH is excluded from the leaderboard aggregation.

9. **Static hardcoded `quiz-data.ts`**: Contains 5 hardcoded Soneium questions — this file is not used by the dynamic quiz flow (which uses Groq-generated questions). It appears to be legacy/fallback data.

10. **Block explorer APIs**: Uses Blockscout API (per-chain `blockscoutApi` in config) or Etherscan-compatible APIs. Some chains use custom explorer APIs — verify after deployment.

11. **`typescript.ignoreBuildErrors: true` in next.config.mjs**: Type errors will not fail the build. Remove or fix underlying issues for stricter production builds.

12. **`images.unoptimized: true`**: All images are served unoptimized (no Next.js image optimization). Acceptable for static assets.

13. **Jina Reader may fail**: The Jina Reader can return errors, 404 pages, login walls, or truncated results. The `isValidContent()` filter checks for bad signals. If all fetches fail, fallback questions are used.

14. **Contract `submitScore` uses `msg.sender`**: The user calls `submitScore` directly. The signature binds `player` (first param) to the signed message, but the contract does NOT verify that `msg.sender == player`. This means a user could submit a signed score on behalf of another address (if they have the signature). The signature includes `nonces[player]` which limits this in practice.

15. **No `onlyQuizScores` modifier on NFT mint**: `QuizNFT.mint()` is callable by anyone. The only guard is `_hasReachedThreshold(msg.sender)` which static-calls QuizScores. This is safe because only the address that earned the points can mint for themselves.
