# Quiz On Chain — Application Overview

> **Generated from codebase analysis — self-contained prompt for any LLM to understand, continue developing, or maintain this project.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Stack](#2-architecture--stack)
3. [Directory Structure](#3-directory-structure)
4. [Supported Chains & Multi-Chain Design](#4-supported-chains--multi-chain-design)
5. [User Roles](#5-user-roles)
6. [Core User Flow](#6-core-user-flow)
7. [Smart Contracts](#7-smart-contracts)
8. [Frontend Components](#8-frontend-components)
9. [API Routes](#9-api-routes)
10. [Quiz Generation Pipeline](#10-quiz-generation-pipeline)
11. [Score Submission Flow](#11-score-submission-flow)
12. [Leaderboard System](#12-leaderboard-system)
13. [NFT Achievement System](#13-nft-achievement-system)
14. [Blockchain Explorer (Bubble Explorer)](#14-blockchain-explorer-bubble-explorer)
15. [Telegram Alerts System](#15-telegram-alerts-system)
16. [Feedback System](#16-feedback-system)
17. [Admin Panel](#17-admin-panel)
18. [Farcaster Mini-App Integration](#18-farcaster-mini-app-integration)
19. [Dynamic Theming System](#19-dynamic-theming-system)
20. [Database & Storage](#20-database--storage)
21. [Security](#21-security)
22. [Environment Variables](#22-environment-variables)
23. [Scripts & Deployment](#23-scripts--deployment)
24. [Development Workflow](#24-development-workflow)

---

## 1. Project Overview

**Quiz On Chain** is a Web3 educational dApp where users test their blockchain knowledge through AI-generated quizzes drawn from official L2 documentation. Users connect a wallet, answer 5 multiple-choice questions, submit their score on-chain via a signed transaction, and climb a cross-chain global leaderboard. Reaching 100 cumulative points on any chain unlocks an NFT badge (ERC-721).

The app operates across **8 blockchain networks** (Ink, Soneium, Base, Unichain, MegaETH, LitVM LiteForge, Arc Testnet, Sepolia) with chain-specific branding, documentation sources, smart contracts, and NFT contracts deployed independently on each.

- **Domain:** https://quizonchain.app
- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4
- **Web3 Stack:** wagmi v3, viem 2, RainbowKit v2, WalletConnect
- **Smart Contracts:** Solidity 0.8.27 via Hardhat
- **Quiz Generation:** Pool-first — pre-generated verified questions per chain (`data/quizzes-*.json`)
- **State / Data:** TanStack React Query, JWT (jose), Upstash Redis
- **Infrastructure:** Vercel deployment, Vercel Analytics, PostCSS

---

## 2. Architecture & Stack

### Frontend Stack

| Technology | Version | Usage |
|---|---|---|
| Next.js | 15 (App Router) | Server-rendered pages, API routes, middleware |
| React | 19 | UI components |
| TypeScript | 6.0.2 | Type-safe code |
| Tailwind CSS | 4.2.2 | Utility-first styling |
| wagmi | 3.6.9 | Wallet connection, chain interactions |
| viem | 2.49.0 | Low-level Ethereum interaction (ABI, encoding, clients) |
| RainbowKit | 2.2.11 | Wallet connect UI |
| TanStack React Query | ^5.100.9 | Server state, caching |
| jose | ^6.2.2 | JWT (quiz tokens, admin sessions) |
| sonner | ^2.0.7 | Toast notifications |
| zod | ^4.3.6 | Schema validation |
| lucide-react | ^1.7.0 | Icons |
| Radix UI | Various | Accessible UI primitives (Dialog, Select, Sheet, etc.) |

### Web3 Stack

| Technology | Usage |
|---|---|
| wagmi connectors | walletConnect, coinbaseWallet, baseAccount, startaleConnector |
| viem public/wallet clients | Read contracts, write transactions, sign messages |
| @base-org/account | Base Account (ERC-4337 smart accounts) |
| @farcaster/miniapp-sdk | Farcaster Mini-App embedding |
| @startale/app-sdk | Startale App connector |
| Ethers v6 | Hardhat deployment scripts |

### Backend (Next.js API Routes)

| Route | Purpose |
|---|---|
| `/api/generate-quiz` | Pool-first quiz serving from pre-generated pools + JWT answer sealing |
| `/api/sign-score` | Server-side EIP-191 signature for on-chain submission |
| `/api/advance-progress` | Track wallet progress (Redis) |
| `/api/feedback` | User feedback via Telegram bot |
| `/api/telegram` | Telegram message proxy |
| `/api/admin/login` | Admin password authentication |
| `/api/admin/quiz-pool` | View quiz pool JSON (admin only) |
| `/api/admin/redis-stats` | Redis wallet tracking stats (admin only) |

### External Services

| Service | Purpose |
|---|---|
| Upstash Redis | Wallet progress tracking |
| Vercel Analytics | Page view analytics |
| Telegram Bot API | Feedback delivery & user alerts |
| WalletConnect | Wallet connection infrastructure |

---

## 3. Directory Structure

```
quizonchain/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers, header, theme)
│   ├── page.tsx                # Home page (renders HomeContent)
│   ├── HomeContent.tsx         # Main app state machine (home→quiz→results)
│   ├── providers.tsx           # Wagmi/Query/RainbowKit/Farcaster providers
│   ├── globals.css             # CSS design system, themes, animations
│   ├── api/
│   │   ├── generate-quiz/route.ts   # Pool-first quiz serving + JWT sealing
│   │   ├── sign-score/route.ts      # EIP-191 signature server
│   │   ├── advance-progress/route.ts# Wallet progress tracking
│   │   ├── feedback/route.ts        # User feedback → Telegram
│   │   ├── telegram/route.ts        # Telegram message proxy
│   │   └── admin/
│   │       ├── login/route.ts       # Admin password login
│   │       ├── quiz-pool/route.ts   # View quiz pool JSON
│   │       └── redis-stats/route.ts # Wallet tracking stats
│   ├── leaderboard/
│   │   ├── page.tsx
│   │   └── LeaderboardContent.tsx   # Tabbed chain leaderboard
│   ├── explorer/
│   │   ├── page.tsx                 # Chain selection grid
│   │   ├── ExplorerContent.tsx
│   │   ├── [chain]/page.tsx         # Per-chain bubble explorer
│   │   └── [chain]/tx/[hash]/page.tsx # TX detail page
│   ├── docs/
│   │   └── DocsContent.tsx          # Documentation/FAQ page
│   └── support/
│       ├── page.tsx
│       └── SupportContent.tsx       # Support/FAQ page
├── components/
│   ├── home-screen.tsx              # Landing screen (connect, start quiz)
│   ├── quiz-screen.tsx              # Quiz questions UI
│   ├── results-screen.tsx           # Score display + submit on-chain
│   ├── header.tsx                   # Nav header with connect button
│   ├── wallet-provider.tsx          # Wallet context wrapper
│   ├── nft-mint.tsx                 # NFT mint modal + progress card
│   ├── leaderboard.tsx              # Leaderboard table component
│   ├── transaction-status.tsx       # TX state badges (pending/confirmed/failed)
│   ├── sign-in-with-base.tsx        # Base Account (ERC-4337) sign-in
│   ├── bubble-explorer.tsx          # Interactive blockchain explorer
│   ├── theme-background.tsx         # Dynamic chain-themed backgrounds
│   ├── theme-updater.tsx            # Theme CSS class management
│   ├── feedback-button.tsx          # Feedback FAB
│   ├── feedback-modal.tsx           # Feedback form modal
│   ├── telegram-alerts-modal.tsx    # Telegram alert config modal
│   ├── explorer-back-button.tsx     # Back button for explorer
│   ├── quiz-on-chain-logo.tsx       # Animated SVG logo
│   ├── base-logo.tsx                # Chain logo SVGs
│   ├── soneium-logo.tsx
│   ├── ink-logo.tsx
│   ├── unichain-logo.tsx
│   ├── megaeth-logo.tsx
│   ├── litvm-logo.tsx
│   ├── arc-logo.tsx
│   └── ui/                          # Radix-based UI primitives
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── checkbox.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── sheet.tsx
│       └── accordion.tsx
├── hooks/
│   ├── use-active-chain.ts          # Get chain config + UI data
│   ├── use-chain-ui.ts              # Get chain-specific Tailwind profile
│   ├── use-farcaster-miniapp.tsx    # Farcaster Mini-App context
│   └── use-telegram-alerts.ts       # Telegram alert settings & polling
├── lib/
│   ├── chains.ts                    # viem chain definitions (all 8 chains)
│   ├── active-chain-config.ts       # Per-chain env-based config (RPC, contracts, docs URLs)
│   ├── chain-ui.ts                  # Per-chain Tailwind class profiles
│   ├── chain-leaderboard.ts         # Cross-chain leaderboard aggregation
│   ├── quiz-data.ts                 # Quiz data types & ecosystem helpers
│   ├── submitScore.ts               # Score submission logic + ABI
│   ├── nft-contracts.ts             # NFT contract addresses + ABI
│   ├── redis.ts                     # Upstash Redis client + wallet progress
│   ├── admin-session.ts             # Admin JWT session management
│   ├── telegram.ts                  # Telegram message helpers
│   ├── base-account-store.ts        # Global store for Base Account provider
│   ├── safe-storage.ts              # SSR-safe localStorage wrapper
│   └── utils.ts                     # cn() helper (clsx + tailwind-merge)
├── contracts/
│   ├── QuizScores.sol               # Score submission contract
│   └── QuizNFT.sol                  # NFT badge contract
├── scripts/
│   ├── deploy.ts                    # Hardhat deploy script (QuizScores)
│   ├── deploy-nft.ts                # Hardhat deploy script (QuizNFT)
│   └── update-base-uri.ts           # Update NFT base URI script
├── data/                            # Quiz pool JSON files (git-ignored structure)
├── hardhat.config.cjs               # Hardhat config (networks, etherscan, solc)
├── next.config.mjs                  # Next.js config (security headers, CSP)
├── postcss.config.mjs               # PostCSS + Tailwind config
├── middleware.ts                    # CORS/origin enforcement for sensitive routes
├── package.json
├── tsconfig.json
└── tsconfig.hardhat.json            # TS config for Hardhat (separate compiler)
```

---

## 4. Supported Chains & Multi-Chain Design

The app is **multi-chain by nature** — users connect their wallet, and the chain they're on determines:
- Which quiz questions they receive (docs from that chain's ecosystem)
- Which `QuizScores` contract their score is submitted to
- Which NFT contract they can mint from
- The visual theme (colors, fonts, border radii, card styles)
- The leaderboard they appear on

### Chain Definitions (defined in `lib/chains.ts`)

| Chain | Chain ID | Type | Native Currency | RPC Endpoint | Block Explorer |
|---|---|---|---|---|---|
| Ink | 57073 | Mainnet | ETH | `rpc-gel.inkonchain.com` | `explorer.inkonchain.com` |
| Soneium | 1868 | Mainnet | ETH | `rpc.soneium.org` | `soneium.blockscout.com` |
| Base | 8453 | Mainnet | ETH | `mainnet.base.org` | `basescan.org` |
| Unichain | 130 | Mainnet | ETH | `mainnet.unichain.org` | `uniscan.xyz` |
| MegaETH | 4326 | Mainnet | ETH | `mainnet.megaeth.com/rpc` | `megaexplorer.xyz` |
| LitVM LiteForge | 4441 | Testnet | zkLTC | `liteforge.rpc.caldera.xyz/http` | `liteforge.explorer.caldera.xyz` |
| Arc Testnet | 5042002 | Testnet | USDC | `rpc.testnet.arc.network` | `testnet.arcscan.app` |
| Sepolia | 11155111 | Testnet | ETH | `ethereum-sepolia-rpc.publicnode.com` | `eth-sepolia.blockscout.com` |

### Active Chain Configuration (`lib/active-chain-config.ts`)

The `NEXT_PUBLIC_ACTIVE_CHAIN` env var allows deploying for a **single chain** (e.g., setting it to `"ink"` customizes the entire app to Ink). Each chain config stores:

```typescript
{
  name: string,           // Display name
  chainId: number,
  color: string,          // Accent color hex
  rpc: string,
  explorer: string,
  blockscoutApi: string,
  contractAddress: string,    // QuizScores contract
  nftContract: string,        // QuizNFT contract
  docsPages: string[],        // Documentation URLs (per-chain Docs page)
  heroTitle: string,
  heroSubtitle: string,
  heroLabel: string,
  nftMetadataPath: string,
  nftImage: string,
}
```

### Chain ID to Config Mapping

```typescript
const CHAIN_ID_TO_KEY = {
  57073: 'ink',
  1868: 'soneium',
  8453: 'base',
  130: 'unichain',
  4326: 'megaeth',
  4441: 'litvm',
  5042002: 'arc',
  11155111: 'sepolia',
};
```

---

## 5. User Roles

### Player (no authentication)
- Connects any EVM wallet (MetaMask, Coinbase Wallet, WalletConnect, Base Account, Startale)
- Takes quizzes on the connected chain
- Submits scores on-chain (pays gas)
- Views leaderboards (global or per-chain)
- Claims NFT badge after reaching 100 points
- Uses block explorer to visualize transactions
- Configures Telegram alerts for high-value transactions

### Admin (password-protected)
- Password: configured via `ADMIN_PASSWORD` env var
- Logs in via `/api/admin/login` (gets HttpOnly JWT cookie)
- Views quiz pool JSON files
- Views Redis wallet tracking stats

---

## 6. Core User Flow

```
Connect Wallet → Fetch Quiz → Answer 5 Questions → Verify Answers → Submit Score On-Chain → View Leaderboard → (at 100 pts) Mint NFT Badge
```

### Step-by-step Flow

1. **Landing** (`HomeScreen` component)
   - User sees animated logo, hero text, "Connect Wallet" button
   - Alternative: "Sign in with Base" (Base Account), "Connect with Startale"
   - Feature highlights: 5 Questions / On-Chain Results / Free to Play

2. **Quiz Generation** (after wallet connected)
   - `HomeContent` auto-calls `fetch('/api/generate-quiz?chainId=...')`
   - Backend loads 5 pre-generated questions from the pool (`data/quizzes-*.json`)
   - Returns `{ questions, quizToken, ecosystem, startIndex }`
   - QuizToken is a JWT containing the correct answers (server-side verification)
   - Questions are shuffled (options randomized) and the correct answers encoded in the JWT

3. **Quiz Interaction** (`QuizScreen`)
   - 5 questions presented one at a time, 4 options each
   - User selects an answer → immediate correct/incorrect feedback shown
   - Progress bar with chain-accent color and shimmer effect
   - After answering all 5, user clicks "See Results"

4. **Results** (`ResultsScreen`)
   - Animated score count-up (0 → actual score)
   - Progress bar animation
   - Score message: "Perfect score! You're a [Chain] master!"
   - NFT progress card (shows points toward 100-pt badge)
   - **Submit Score On-Chain** button

5. **On-Chain Submission**
   - Opens confirmation modal with gas estimation
   - Calls `/api/sign-score` with `{ playerAddress, score, total, nonce, chainId, contractAddress, quizToken, answers }`
   - Server verifies the quiz token, recalculates score, signs an EIP-191 message with the **trusted signer key**
   - Client calls `submitScore(score, total, signature)` on the `QuizScores` contract
   - Waits for transaction confirmation, polls block explorer
   - Advances wallet progress on Redis
   - Cross-tab cooldown sync via localStorage

6. **Post-Submission**
   - 1-hour cooldown enforced by the `QuizScores` contract
   - Cooldown timer displayed on home screen
   - Cross-tab sync and visibility-change re-sync prevent timer drift
   - User can retry after cooldown

---

## 7. Smart Contracts

### QuizScores.sol (Score Submission Contract)

**Inherits:** `ReentrancyGuard`, `Ownable`, `Pausable`

**State:**
- `scores[address]` — last Score struct (score, total, timestamp)
- `lastSubmissionAt[address]` — timestamp of last submission
- `nonces[address]` — replay protection counter
- `cooldownPeriod` — default 1 hour (owner-settable, max 24h)
- `maxTotal` — default 5 (max 20)
- `trustedSigner` — address that signs score attestations
- `totalPoints[address]` / `totalGames[address]` — cumulative stats
- `players[]` / `hasPlayed[address]` — player registry
- `DOMAIN_SEPARATOR` — EIP-712 style domain separator

**Key Functions:**
- `submitScore(uint8 score, uint8 total, bytes calldata sig)` — validates cooldown, total=5, signature, increments points/games
- `getLeaderboard()` — returns `(address[] addrs, uint256[] points, uint256[] games)` for all players
- `getTimeUntilNextSubmission(address player)` — view function for cooldown
- `setCooldownPeriod(uint256)`, `setTrustedSigner(address)`, `setMaxTotal(uint8)` — owner-only
- `clearScore(address)`, `pause()`, `unpause()` — owner-only

**Signature Scheme (EIP-191):**
```
digest = keccak256(abi.encode(DOMAIN_SEPARATOR, player, score, total, nonce, block.chainid, address(this)))
signature = sign(keccak256("\x19Ethereum Signed Message:\n32" + digest))
```

### QuizNFT.sol (Badge NFT Contract)

**Inherits:** `ERC721URIStorage`, `Ownable`, `ReentrancyGuard`, `Pausable`

**Token:** "The What of Blockchain" (symbol: "TWOB")

**State:**
- `totalMinted` — counter
- `baseTokenURI` — metadata base URL
- `quizScoresContract` — linked QuizScores address (for points checking)
- `pointsThreshold` — default 100 (owner-settable)
- `hasMinted[address]` — prevents double-mint
- `maxSupply` — default 10,000

**Key Functions:**
- `mint()` — checks `!hasMinted`, `totalPoints >= threshold`, `totalMinted < maxSupply`; mints with auto-incrementing tokenId and URI `{baseURI}/{tokenId}.json`
- `canMint(address)` — public view eligibility checker
- `setBaseTokenURI(string)`, `setPointsThreshold(uint256)`, `proposeQuizScoresContract`, `acceptQuizScoresContract` — owner-only

**Cross-Contract Call:** Uses `staticcall` to `quizScoresContract.totalPoints(player)` to check threshold without requiring a direct state read.

---

## 8. Frontend Components

### Application Shell

| Component | File | Purpose |
|---|---|---|
| `RootLayout` | `app/layout.tsx` | HTML shell, fonts, metadata, Providers, Header, ThemeBackground, FeedbackButton, Toaster, Analytics |
| `Providers` | `app/providers.tsx` | WagmiProvider, QueryClientProvider, RainbowKitProvider (dynamic accent color), FarcasterMiniAppProvider. Also polyfills `localStorage` if missing. |
| `Header` | `components/header.tsx` | Floating nav bar with logo, nav pills (Quiz, Leaderboard, Docs, Explorer, Support), ConnectButton, NFT trigger, mobile sheet menu |
| `WalletProvider` | `components/wallet-provider.tsx` | React Context wrapping RainbowKit's `useConnectModal` |
| `ThemeBackground` | `components/theme-background.tsx` | Chain-specific ambient backgrounds (gradients, noise textures, grid patterns) |
| `ThemeUpdater` | `components/theme-updater.tsx` | Applies CSS theme class (`theme-soneium`, `theme-megaeth`, etc.) to `<html>` based on connected chain |

### Quiz Flow Components

| Component | File | Purpose |
|---|---|---|
| `HomeContent` | `app/HomeContent.tsx` | **Main app orchestration.** State machine managing `home → quiz → results` screens, quiz fetching, cooldown management, cross-tab sync, ecosystem mismatch detection |
| `HomeScreen` | `components/home-screen.tsx` | Landing: logo, hero text, connect/startale buttons, cooldown display, Shuffle button, Start Quiz button, NFT progress card, feature stat cards |
| `QuizScreen` | `components/quiz-screen.tsx` | Quiz UI: progress bar (chain-accent color + shimmer), question card, 4 answer option buttons (A/B/C/D), correct/incorrect feedback, "Next Question" / "See Results" |
| `ResultsScreen` | `components/results-screen.tsx` | Score display (animated count-up), percentage progress bar, NFT unlock card, "Submit Score On-Chain" flow with confirmation modal, gas estimation, wrong network detection, switch chain flow, TX status polling |

### Leaderboard

| Component | File | Purpose |
|---|---|---|
| `LeaderboardContent` | `app/leaderboard/LeaderboardContent.tsx` | Tab bar for chain selection (Global, Ink, Soneium, Base, Unichain, MegaETH, LitVM, Arc, Sepolia). Each tab gets a chain-specific accent color. |
| `Leaderboard` | `components/leaderboard.tsx` | Data table: rank, wallet address (truncated), chain badges (for Global view), points, games, average %. Skeleton loading, empty states, error banners for failed RPCs. NFT holder data integration (Masters count, Show Masters Only toggle). 30-second auto-refresh. |

### NFT Mint

| Component | File | Purpose |
|---|---|---|
| `NftMintModal` | `components/nft-mint.tsx` | Full modal: NFT image preview, on-chain status (points, canMint, hasMinted), mint button, TX lifecycle (pending → confirmed → TX/NFT view links), confetti canvas animation on success |
| `NftProgressCard` | `components/nft-mint.tsx` | Inline card shown on home/results: points toward 100 threshold, gradient progress bar, claim button when eligible |

### Explorer

| Component | File | Purpose |
|---|---|---|
| `ExplorerContent` | `app/explorer/ExplorerContent.tsx` | Chain selection grid with icons |
| Bubble Explorer | `components/bubble-explorer.tsx` | **~2,150-line interactive visual explorer.** Fetches live transactions from Blockscout API v2 every 15s. Renders animated bubbles whose size = transaction value. Supports search (TX hash, address, ENS, block), Telegram alert integration, transaction detail panel. |

### Other Components

| Component | File | Purpose |
|---|---|---|
| `DocsContent` | `app/docs/DocsContent.tsx` | Documentation viewer with sections: About, How It Works, Supported Networks, Smart Contract addresses, Scoring & Cooldown, NFT Achievements, Explorer, Telegram Alerts, Leaderboard, FAQ |
| `SupportContent` | `app/support/SupportContent.tsx` | FAQ accordion + contact links |
| `SignInWithBase` | `components/sign-in-with-base.tsx` | Base Account (ERC-4337 smart account) sign-in button |
| `TransactionStatus` | `components/transaction-status.tsx` | Badge component: pending/animated/confirmed/failed |
| `FeedbackButton` | `components/feedback-button.tsx` | Floating action button (bottom-right) |
| `FeedbackModal` | `components/feedback-modal.tsx` | Feedback form: Telegram/X username, EVM address, text, up to 4 images |
| `TelegramAlertsModal` | `components/telegram-alerts-modal.tsx` | Configure bot token, chat ID, value threshold, TX types, cooldown |

### Chain Logo Components

Separate SVG components for each chain (used in header navigation and hero area):
- `base-logo.tsx`, `soneium-logo.tsx`, `ink-logo.tsx`, `unichain-logo.tsx`
- `megaeth-logo.tsx`, `litvm-logo.tsx`, `arc-logo.tsx`
- `quiz-on-chain-logo.tsx` (disconnected state logo)

### UI Primitives (`components/ui/`)

Radix-based accessible primitives with shared styling:
- `button.tsx` — uses `class-variance-authority` for variant system
- `dialog.tsx` — modal dialog
- `select.tsx` — dropdown select
- `switch.tsx` — toggle switch
- `checkbox.tsx` — checkbox
- `input.tsx` / `textarea.tsx` / `label.tsx` — form elements
- `progress.tsx` — progress bar
- `sheet.tsx` — slide-out panel (mobile nav)
- `accordion.tsx` — collapsible sections

---

## 9. API Routes

### `GET /api/generate-quiz?chainId={id}&address={addr}`

**Purpose:** Serve 5 quiz questions from a pre-generated pool with JWT-sealed answers.

**Flow:**
1. Rate limit check (5 req/min per IP, in-memory Map)
2. Resolve chain → ecosystem → load its pre-generated pool from `data/quizzes-{key}.json` via `getPoolFileKey(ecosystem)`
3. Wallet-bound (address param): read `startIndex` from Redis (`getWalletProgress`) and serve the next 5 questions sequentially (wrap-around)
4. Anonymous: pick 5 random questions from the pool (`fisherYatesPick`)
5. Shuffle option order per question (`shuffleOptions`)
6. Sign a JWT (`HS256`, 15min TTL) containing the correct answers
7. If the pool is missing or < 5 questions: fall back to hardcoded 5-question sets (Arc, MegaETH, LitVM have custom sets)
8. Return `{ questions, quizToken, sources, usedFallbackQuestions, ecosystem, startIndex }`

**Fallback:** Hardcoded 5-question sets are used when a pool file is missing or has fewer than 5 questions (Arc, MegaETH, LitVM have custom sets; other chains use a generic template).

**Timeout/Constraints:** `maxDuration = 60s` (Vercel), 60s client-side abort.

### `POST /api/sign-score`

**Purpose:** Server-side EIP-191 signature for on-chain score submission. This is the **security backbone** — prevents users from submitting arbitrary scores.

**Body:**
```typescript
{
  playerAddress: string,
  score: number,          // 0-255
  total: number,          // 1-20
  nonce: number,          // from contract
  chainId: number,
  contractAddress: string,
  quizToken?: string,     // optional in dev
  answers?: number[]      // optional in dev
}
```

**Flow:**
1. Origin CORS check (ALLOWED_ORIGINS list)
2. Rate limit (2 req/min per IP + 2 req/min per player address)
3. Schema validation (zod)
4. **Server-side score verification:** If `quizToken` and `answers` provided, decode JWT, recalculate score server-side, reject mismatch
5. Encode `(playerAddress, score, total, nonce, chainId, contractAddress)` via `abi.encode` (padded)
6. Hash with `keccak256`, sign with `QUIZ_SIGNER_PRIVATE_KEY` via `personalSign` (EIP-191)
7. Return `{ signature, trustedSigner }`

### `POST /api/advance-progress`

**Purpose:** Increment Redis wallet progress counter after successful on-chain submission.

**Body:** `{ chainId: number, address: string }`

**Flow:** Zod validation → resolve ecosystem from chainId → `incrementWalletProgress(ecosystem, address, 5)` in Redis.

### `POST /api/feedback`

**Purpose:** User feedback submission relayed to a Telegram channel.

**Flow:**
1. CORS check (expanded to allow any `quizonchain-*` subdomain)
2. Rate limit (2/min per IP)
3. Parse `multipart/form-data`: Telegram username, X username, EVM address, feedback text (10-2000 chars), up to 4 images
4. Validate image files: extension check (png/jpg/webp/gif), MIME type, magic bytes, total ≤ 20MB
5. Build Telegram HTML message, send via bot to admin chat
6. Send images as photo messages

### `POST /api/telegram`

**Purpose:** Proxy for sending Telegram messages from client-side code.

**Body:** `{ botToken, chatId, message }`

**Flow:** CORS check → rate limit (3/min) → forward to Telegram Bot API → return result.

### `POST /api/admin/login`

**Purpose:** Admin authentication.

**Body:** `{ password: string }`

**Flow:** Compare against `ADMIN_PASSWORD` env var → create JWT session (24h TTL) → set `HttpOnly`, `Secure`, `SameSite=Strict` cookie.

### `GET /api/admin/quiz-pool?file=quizzes-{ecosystem}.json`

**Purpose:** Read quiz pool files from `data/` directory (admin only).

**Auth:** JWT session cookie required.
**Allowed files:** `quizzes-litvm.json`, `quizzes-base.json`, `quizzes-ink.json`, `quizzes-unichain.json`, `quizzes-soneium.json`, `quizzes-megaeth.json`, `quizzes-arc.json`.

### `GET /api/admin/redis-stats`

**Purpose:** View Redis wallet tracking stats (admin only).

**Auth:** JWT session cookie required.

**Returns:**
```typescript
{
  configured: boolean,
  totalWallets: number,
  totalSubmitted: number,
  wallets: Array<{
    ecosystem, ecosystemKey, address,
    questionsDone, quizzesDone,
    totalQuizzes, questionsPerSession,
    progressPct, nearCompletion
  }>,
  ecosystems: Record<string, {
    wallets, submittedSessions, totalPool, nearCompletion
  }>
}
```

---

## 10. Quiz Generation Pipeline

### Overview

Quiz content comes from **pre-generated verified pools** — one static JSON file per ecosystem (`data/quizzes-*.json`). Pools are produced **offline** (docs fetched via Jina Reader, questions generated and verified in a batch run), then committed to the repo. The app makes **no AI/LLM calls at request time**.

### Serving Flow (`app/api/generate-quiz/route.ts`)

1. Chain ID → ecosystem via `getEcosystem` (`lib/quiz-data.ts`)
2. Load the pool via `getPoolFileKey(ecosystem)` → `data/quizzes-{key}.json`
3. Wallet-bound requests: read the wallet's `startIndex` from Redis (`getWalletProgress`) and serve the next 5 questions sequentially (wrap-around), so users progress through the pool over sessions
4. Anonymous requests: `fisherYatesPick` 5 random questions from the pool
5. `shuffleOptions` randomizes which option is correct per session
6. Correct answers are sealed in an HS256 JWT (`quizToken`, 15min TTL) and re-verified server-side at `/api/sign-score`
7. Anonymous responses are edge-cached (`s-maxage=60`); wallet-bound responses are `no-store`
8. Missing/small pool → hardcoded fallback question sets (Arc, MegaETH, LitVM have custom sets)

### Quiz Pool Files (`data/quizzes-*.json`)

Pre-generated quiz question pools stored as JSON files:

```typescript
interface PoolData {
  meta: { ecosystem, batchId, generatedAt, totalQuizzes, questionsPerSession }
  quizzes: Array<{ id, question, options, correctIndex, source?: { url, section, heading, fetchedAt } }>
}
```

Questions are sampled from the pool starting from `startIndex` (tracked per-wallet in Redis), enabling progress through the full pool over multiple sessions.

---

## 11. Score Submission Flow

### Detailed Flow Diagram

```
User clicks "Submit Score"
  → Confirmation modal opens (shows estimated gas)
  → User confirms
  → Client calls POST /api/sign-score
    → Server validates origin (CORS)
    → Server checks rate limits (IP + player)
    → Server validates request body (zod)
    → Server decodes quizToken JWT
    → Server recalculates score from answers
    → Server matches calculated score vs client-reported score
    → Server encodes (address, score, total, nonce, chainId, contract)
    → Server signs with QUIZ_SIGNER_PRIVATE_KEY (EIP-191)
    → Returns { signature, trustedSigner }
  → Client calls contract.submitScore(score, total, signature)
    → Contract validates: cooldown, total=5, signature recovery
    → Contract updates: scores[], lastSubmissionAt[], nonces++
    → Contract increments: totalPoints[], totalGames[]
    → Contract emits: ScoreSubmitted, CooldownUpdated
    → Returns transaction hash
  → Client waits for receipt (polls with viem)
  → Client polls block explorer API until TX indexed (15s max)
  → Client calls POST /api/advance-progress (fire-and-forget)
  → Client dispatches localStorage event (cross-tab cooldown sync)
  → Success UI: "Score Submitted!" with TX/NFT links
```

### Key Security Properties

1. **Score is verified server-side** — the `/api/sign-score` route decodes the quiz JWT, recalculates the score from user answers, and rejects tampered scores
2. **Nonce-based replay protection** — the contract tracks `nonces[address]` and increments on each submission
3. **Cooldown enforcement on-chain** — the contract rejects submissions within 1 hour of the last one
4. **Trusted signer key is server-only** — `QUIZ_SIGNER_PRIVATE_KEY` never leaves the server environment

---

## 12. Leaderboard System

### Architecture

Leaderboards are fetched **directly from on-chain contract storage** — no database involved. The `QuizScores.getLeaderboard()` view function returns all players, their total points, and total games.

### Single Chain Leaderboard (`getChainLeaderboard` in `lib/chain-leaderboard.ts`)

- Creates a `viem` public client for the specific chain
- Calls `getLeaderboard()` on the deployed `QuizScores` contract
- Sorts by points descending, assigns ranks
- Computes average score percentage `(points / (games * 5)) * 100`
- Retry logic: 3 attempts with exponential backoff

### Global Leaderboard (`fetchGlobalLeaderboard`)

- Queries ALL 8 chains in parallel (`Promise.allSettled`)
- Merges results by wallet address (lowercase), summing points and games
- Tracks which chains each player has participated on
- Reports which chains failed to respond
- Sorted by total points descending

### Frontend Display

- **LeaderboardContent:** Tab bar for chain selection (9 tabs: Global + 8 chains)
- Tab accent colors match each chain's brand color
- **Leaderboard component:**
  - Table: Rank, Wallet (truncated, e.g. `0x1234...5678`), Chains (icons for Global view), Points, Games, Avg %
  - Top 20 players displayed
  - 30-second auto-refresh, manual refresh button
  - Skeleton loading placeholders
  - Error banners for failed RPC connections
  - NFT integration: "Masters" count (total NFTs minted), "Show Masters Only" toggle
  - Empty states with chain-appropriate styling

### NFT Integration on Leaderboard

- Queries `totalMinted` and `hasMinted` for each player across all NFT contracts
- 5-minute in-memory cache for NFT data
- "Masters" count card (star icon + count)
- "Show Masters Only" toggle filters to players who hold the NFT badge

---

## 13. NFT Achievement System

### Threshold

- Players need **100 cumulative points** on the `QuizScores` contract of a specific chain
- Points are accumulated across all quiz submissions on that same chain

### Check & Mint Flow

1. After each score submission, `ResultsScreen` and `HomeScreen` read:
   - `QuizScores.totalPoints(player)` → check if ≥ 100
   - `QuizNFT.hasMinted(player)` → check if already minted
2. If eligible (≥100 pts and not yet minted), a **"Claim Master NFT"** button appears
3. Clicking opens the `NftMintModal`:
   - Shows NFT image (`/nft/{chain-name}.png`)
   - Shows on-chain state (points, canMint, hasMinted, totalMinted)
   - Gas estimation for mint transaction
   - On confirm: calls `QuizNFT.mint()` → detects tokenId from Transfer event log
   - Confetti animation on success
   - Links to view TX on explorer and NFT on marketplace

### NFT Contract Details

- **Token Name:** "The What of Blockchain"
- **Symbol:** "TWOB"
- **URI Pattern:** `{baseTokenURI}/{tokenId}.json`
- **Cross-contract call:** `QuizNFT._hasReachedThreshold()` uses `staticcall` to `QuizScores.totalPoints(player)`
- **Max Supply:** 10,000 (owner-adjustable)
- **Two-step ownership transfer** for the linked QuizScores contract (`proposeQuizScoresContract` → `acceptQuizScoresContract`)

---

## 14. Blockchain Explorer (Bubble Explorer)

### Overview

A ~2,150-line interactive visual blockchain explorer (`components/bubble-explorer.tsx`) that fetches transactions from **Blockscout API v2** endpoints and renders them as animated, size-coded bubbles.

### Supported Block Explorers

| Chain | Blockscout API Base |
|---|---|
| Soneium | `https://soneium.blockscout.com/api/v2` |
| Ink | `https://explorer.inkonchain.com/api/v2` |
| Base | `https://base.blockscout.com/api/v2` |
| Unichain | `https://unichain.blockscout.com/api/v2` |
| MegaETH | `https://megaeth.blockscout.com/api/v2` |
| LitVM | `https://liteforge.explorer.caldera.xyz/api/v2` |
| Arc | `https://testnet.arcscan.app/api/v2` |
| Sepolia | `https://eth-sepolia.blockscout.com/api/v2` |

### Features

- **Live transaction stream:** Polls Blockscout API every 15 seconds
- **Bubble visualization:** Each transaction is a circle sized by value (ETH). Color-coded by type (transfer, contract call, token transfer, NFT transfer)
- **Search:** TX hash, wallet address, ENS, block number
- **Whale alerts:** Built-in Telegram alert integration (configurable threshold)
- **Transaction detail panel:** Click a bubble to view from/to, value, method, timestamp, internal transactions
- **Chain selector:** Top nav to switch chains
- **TX sharing:** Share TX link via clipboard
- **Chain-specific theming:** colors, fonts, card styles match the active chain

---

## 15. Telegram Alerts System

### Architecture

**Two Telegram bot integrations:**

1. **User-Configured Alerts** (Explorer feature)
   - Users set up their own Telegram bot via the `TelegramAlertsModal`
   - Configure: bot token, chat ID, minimum value threshold, transaction types, cooldown
   - Settings saved in `localStorage`
   - The `useTelegramAlerts` hook polls the explorer and sends alerts via `POST /api/telegram` (proxy)
   - Alert format includes: TX type, value, from/to addresses, explorer link

2. **Admin Feedback Channel**
   - `POST /api/feedback` sends user feedback to a Telegram channel
   - Configured via `FEEDBACK_TELEGRAM_BOT_TOKEN` and `FEEDBACK_TELEGRAM_CHAT_ID` env vars
   - Handles text + image attachments

### `/api/telegram` Proxy

- CORS-restricted to the main domain
- Rate-limited (3 req/min)
- Forwards `{ botToken, chatId, message }` to Telegram Bot API
- Used to avoid exposing bot tokens client-side

---

## 16. Feedback System

### Components

- **FeedbackButton:** Fixed FAB at bottom-right of screen
- **FeedbackModal:** Form with fields:
  - Telegram username (optional, 5-32 chars)
  - X/Twitter username (optional, 1-15 chars)
  - EVM address (optional, hex format)
  - Feedback text (required, 10-2000 chars)
  - Up to 4 images (PNG/JPG/WebP/GIF, max 20MB total)

### Backend (`POST /api/feedback`)

1. CORS + rate limiting
2. Image validation: extension, MIME type, magic bytes (PNG header, JPEG SOI, GIF, WebP RIFF)
3. HTML tag stripping on text inputs
4. Build Telegram message with contact info + feedback text + timestamp + IP hash
5. Send text message + image attachments to admin Telegram chat

---

## 17. Admin Panel

### Authentication

- Password-based login via `POST /api/admin/login`
- Session stored as HttpOnly JWT cookie (24h TTL, Secure, SameSite=Strict)
- Secret derived from `QUIZ_JWT_SECRET` or `ADMIN_PASSWORD`

### Admin Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/admin/login` | Login (returns Set-Cookie) |
| `GET /api/admin/login` | Check if authenticated |
| `GET /api/admin/quiz-pool?file=quizzes-{eco}.json` | View quiz pool JSON |
| `GET /api/admin/redis-stats` | View wallet tracking stats |

### Redis Stats Dashboard Data

```
{
  configured: boolean,
  totalWallets: number,
  totalSubmitted: number,
  wallets: [{ ecosystem, address, questionsDone, quizzesDone, progressPct, nearCompletion }],
  ecosystems: { [key]: { wallets, submittedSessions, totalPool, nearCompletion } }
}
```

---

## 18. Farcaster Mini-App Integration

### Overview

The app can run as a **Farcaster Mini-App** using the `@farcaster/miniapp-sdk`.

### Implementation

- **Hook:** `useFarcasterMiniApp` (context provider wrapping the SDK)
- **Detection:** `sdk.isInMiniApp()` on mount
- **Capabilities:** Reads notification support, FID, user profile, safe area insets
- **Notification Prompt:** When running inside Farcaster, automatically prompts the user to add the mini-app (unless already added)

### Metadata

The root layout includes Farcaster frame metadata:
```json
{
  "fc:miniapp": {
    "version": "1",
    "imageUrl": "https://quizonchain.app/logo.png",
    "button": {
      "title": "Play Quiz On Chain",
      "action": { "type": "launch_miniapp", "url": "https://quizonchain.app", "name": "Quiz On Chain" }
    }
  }
}
```

---

## 19. Dynamic Theming System

The app features a **per-chain dynamic theme** that changes colors, fonts, border radii, and visual style when the user connects to a different chain.

### Architecture

Three layers work together:

1. **CSS Variables + Theme Classes** (`app/globals.css`)
   - Each chain gets a `.theme-{name}` class overriding CSS custom properties (--background, --primary, --accent, --border, etc.)
   - Chain-specific body backgrounds, fonts (MegaETH=monospace, Unichain=serif, Ink=default, LitVM=Outfit+Rajdhani, Arc=DM Sans+Space Grotesk)
   - Utility classes per chain: `.litvm-card`, `.arc-glow`, `.mega-btn-primary`, etc.

2. **Programmatic UI Profiles** (`lib/chain-ui.ts`)
   - A `ChainUIProfile` object per chain with ~50 Tailwind class strings for every UI element:
     - `btnPrimary`, `btnSecondary`, `btnCta`, `btnOutline`
     - `card`, `cardStrong`, `statCard`
     - `heading`, `subheading`, `bodyMuted`, `label`
     - `navPill`, `navActive`, `navInactive`
     - `page`, `pageMain`, `header`, `headerFloating`
     - `input`, `sheet`, `tabBar`, `tabActive`, `tabInactive`
     - `progressTrack`, `connectBtn`, `error`, `warning`
     - `radius`, `radiusSm`, `radiusNav`
     - Styling metadata: `isLight`, `fontMono`, `fontSerif`, `fontDisplay`, `labelPrefix`, `labelCase`

3. **Theme Backgrounds** (`components/theme-background.tsx`)
   - Per-chain ambient backgrounds:
     - `default`: radial purple/red gradients + blur
     - `megaeth`: solid black + CRT scanline overlay
     - `ink`: solid dark + noise texture
     - `unichain`: pink grid pattern
     - `base`: white + noise
     - `soneium`: deep blue + noise
     - `litvm`: navy blue gradient + ambient cyan + noise + grid lines
     - `arc`: dark navy + ambient blue glow

### Theme Resolution

```
Wallet Connects → useAccount().chainId → getChainConfig(chainId)
  → getThemeName(config) → apply CSS theme class to <html>
  → getChainThemeKey(config.name, isConnected) → ChainThemeKey
  → getChainUI(name, connected) → ChainUIProfile (all Tailwind classes)
```

### Chain-Specific Design Details

| Chain | Theme | Accent | Style Vibes | Radius |
|---|---|---|---|---|
| Disconnected | default | White (#FFF) | Dark OLED, purple gradients | rounded-xl |
| Ink | theme-ink | Purple (#8b5cf6) | Purple glow, bold CTA, rounded-full | rounded-3xl / full |
| Soneium | theme-soneium | Blue (#0047FF) | Deep navy, blue accents, clean | rounded-xl |
| Base | theme-base | Blue (#0052FF) | **Light mode** (white bg, black text) | rounded-xl |
| Unichain | theme-unichain | Pink (#FF007A) | **Serif font**, pink accents, dark purple | rounded-2xl |
| MegaETH | theme-megaeth | Green (#00ff88) | **Monospace**, terminal aesthetic, green/black, **no border radius**, crosshair cursor, CRT scanline | rounded-none |
| LitVM | theme-litvm | Cyan (#00F2FE) | **Monospace**, navy cyan, Rajdhani headings, Outfit body, glassmorphic | rounded-xl |
| Arc Testnet | theme-arc | Blue (#4D8EE9) | DM Sans / Space Grotesk, professional financial feel | rounded-xl |

---

## 20. Database & Storage

### Redis (Upstash — `lib/redis.ts`)

Used for **wallet progress tracking** across quiz sessions.

| Key Pattern | Purpose | TTL |
|---|---|---|
| `progress:{ecosystem}:{address}` | Total questions answered (incremented by 5 per submission) | None |
| `submitted:{ecosystem}:{address}:{startIndex}` | Track which question indices have been submitted (prevent re-use) | 24h |

Notable: Redis is **optional** — if `KV_REST_API_URL`/`KV_REST_API_TOKEN` are not configured, it gracefully degrades (returns 0/false).

### localStorage

Used for:
- **Telegram alert settings** (`telegram_alert_settings` key) — user's bot token, chat ID, thresholds
- **Cross-tab cooldown sync** (`quiz-cooldown-sync` key) — when one tab submits a score, other tabs are notified
- **Quiz session token** — ephemeral quiz JWT

### In-Memory (Server-Side)

- **Rate limiting:** `Map<string, {count, resetTime}>` per IP for several API routes (generate-quiz, sign-score, feedback, telegram)
- **Question history cache:** `Map<string, string[]>` — tracks recently asked questions per ecosystem to avoid repetition (max 50 per ecosystem)

### Quiz Pool Files (`data/`)

Pre-generated question pools stored as JSON files:
```
data/quizzes-ink.json
data/quizzes-soneium.json
data/quizzes-base.json
data/quizzes-unichain.json
data/quizzes-megaeth.json
data/quizzes-litvm.json
data/quizzes-arc.json
```

---

## 21. Security

### CORS / Origin Enforcement

- **Middleware** (`middleware.ts`): Blocks requests to `/api/sign-score` and `/api/telegram` from disallowed origins (configurable `ALLOWED_ORIGINS` list)
- **Route-level CORS:** Each sensitive API route double-checks `origin` and `referer` headers
- Expanded CORS for feedback: allows any `quizonchain-*.vercel.app` subdomain (preview deployments)

### Score Integrity

1. Quiz answers are embedded in a **signed JWT** at generation time
2. User submits both their answers and the token to `/api/sign-score`
3. **Server recalculates** the score from answers vs JWT — rejects discrepancies
4. The resulting score is signed with the **trusted server key** (EIP-191)
5. The smart contract recovers the signer — only accepts signatures from `trustedSigner`

### Admin Security

- HttpOnly, Secure, SameSite=Strict cookie for admin sessions
- 24h session TTL
- JWT verification on every admin endpoint

### Input Validation

- **zod** schemas on every API route
- HTML tag stripping on feedback text
- Image magic byte validation (not just extension/MIME)
- Address validation via `viem.isAddress()`

### Headers (next.config.mjs)

- Strict CSP (Content-Security-Policy)
- HSTS (Strict-Transport-Security, 1 year, preload)
- X-Content-Type-Options: nosniff
- Permissions-Policy: camera/mic/geo disabled
- X-XSS-Protection
- Referrer-Policy: strict-origin-when-cross-origin
- Cross-Origin-Opener-Policy: same-origin-allow-popups

### Rate Limiting

| Route | Limit | Window |
|---|---|---|
| `/api/generate-quiz` | 5 per IP | 60s |
| `/api/sign-score` | 2 per IP + 2 per address | 60s |
| `/api/feedback` | 2 per IP | 60s |
| `/api/telegram` | 3 per IP | 60s |

### Smart Contract Security

- OpenZeppelin `ReentrancyGuard` on all state-mutating functions
- OpenZeppelin `Pausable` for emergency stop
- OpenZeppelin `Ownable` for admin functions
- ECDSA signature verification via OpenZeppelin
- Nonce-based replay protection
- Cooldown enforcement (max 24h)

---

## 22. Environment Variables

```bash
# === Wallet Connect ===
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=       # WalletConnect Cloud project ID

# === Quiz & Signing ===
QUIZ_JWT_SECRET=                            # JWT secret for quiz tokens
QUIZ_SIGNER_PRIVATE_KEY=                    # Server-side ECDSA signer key (32 bytes hex)
# Falls back to: SIGNER_PRIVATE_KEY

# === Active Chain (optional — for single-chain deployments) ===
NEXT_PUBLIC_ACTIVE_CHAIN=                   # e.g., "ink", "soneium", "base"

# === Contract Addresses (QuizScores) ===
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=       # Soneium (1868)
NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET=   # Ink (57073)
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET=  # Base (8453)
NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN=      # Unichain (130)
NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH=       # MegaETH (4326)
NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM=         # LitVM (4441)
NEXT_PUBLIC_CONTRACT_ADDRESS_ARC=           # Arc (5042002)
NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=       # Sepolia (11155111)

# === NFT Contract Addresses ===
NEXT_PUBLIC_NFT_CONTRACT_INK=               # Ink NFT
NEXT_PUBLIC_NFT_CONTRACT_SONEIUM=           # Soneium NFT
NEXT_PUBLIC_NFT_CONTRACT_BASE=              # Base NFT
NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN=          # Unichain NFT
NEXT_PUBLIC_NFT_CONTRACT_MEGAETH=           # MegaETH NFT
NEXT_PUBLIC_NFT_CONTRACT_LITVM=             # LitVM NFT
NEXT_PUBLIC_NFT_CONTRACT_ARC=               # Arc NFT
NEXT_PUBLIC_NFT_CONTRACT_SEPOLIA=           # Sepolia NFT

# === Upstash Redis ===
KV_REST_API_URL=                            # Upstash Redis REST URL
KV_REST_API_TOKEN=                          # Upstash Redis REST token
# Falls back to: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN

# === Admin ===
ADMIN_PASSWORD=                             # Admin panel password

# === Feedback Telegram ===
FEEDBACK_TELEGRAM_BOT_TOKEN=                # Bot token for receiving feedback
FEEDBACK_TELEGRAM_CHAT_ID=                  # Chat ID for feedback delivery

# === Hardhat Deployment ===
PRIVATE_KEY=                                # Deployer private key
BASESCAN_API_KEY=                           # For Base contract verification

# === App Domain ===
NEXT_PUBLIC_APP_DOMAIN=                     # Default: quizonchain.app
```

---

## 23. Scripts & Deployment

### Package Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbo` | Dev server (Turbo) |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `npx eslint .` | Lint check |
| `compile` | `hardhat compile` | Compile Solidity contracts |
| `deploy:minato` | `hardhat run scripts/deploy.ts --network soneiumMinato` | Deploy to Soneium Minato testnet |
| `deploy:mainnet` | `hardhat run scripts/deploy.ts --network soneiumMainnet` | Deploy to Soneium mainnet |
| `deploy:sepolia` | `hardhat run scripts/deploy.ts --network sepoliaTestnet` | Deploy to Sepolia |

### Smart Contract Deployment

**Hardhat config** (`hardhat.config.cjs`) supports 9 networks:
- soneiumMinato (1946), soneiumMainnet (1868), inkonchain (57073)
- baseMainnet (8453), unichainMainnet (130), megaethMainnet (4326)
- litvmTestnet (4441), arcTestnet (5042002), sepoliaTestnet (11155111)

Deployment script (`scripts/deploy.ts`):
1. Loads env vars
2. Deploys `QuizScores` contract with the deployer as initial `trustedSigner`
3. After deployment, the `QUIZ_SIGNER_PRIVATE_KEY`'s corresponding address must be set as `trustedSigner` via `setTrustedSigner()`

**NFT Deployment** (`scripts/deploy-nft.ts`):
1. Deploys `QuizNFT` contract, linking to the already-deployed `QuizScores`
2. Sets base token URI and points threshold (100)

**Base URI Update** (`scripts/update-base-uri.ts`):
- Updates the `baseTokenURI` on an existing `QuizNFT` contract

### Vercel Deployment

- Platform: Vercel
- CSP headers configured in `next.config.mjs` (extensive allowlist for RPCs, explorers, WalletConnect)
- `@vercel/analytics` for page views
- Serverless function timeout: 60s (quiz API)

---

## 24. Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Fill in required env vars (see Section 22)

# Run dev server
npm run dev

# Build for production
npm run build
```

### Compiling Contracts

```bash
npm run compile
```

### Deploying Contracts

```bash
# Deploy QuizScores to a specific network
npm run deploy:sepolia   # or deploy:minato, deploy:mainnet

# After deployment, set the trusted signer address in the contract
```

### Code Quality

- TypeScript strict mode (`strict: true` in `tsconfig.json`)
- ESLint for linting
- No test suite currently configured (ponytail: add when core logic warrants)

### Key Conventions

- **Path alias:** `@/*` maps to project root
- **CSS:** Tailwind v4 with PostCSS, CSS variables for theming, `@theme inline` directive
- **Fonts:** Orbitron (display), Exo 2 (body), Geist (sans), Geist Mono (mono), plus chain-specific overrides
- **State:** React state + TanStack Query for server state; no global state library
- **Types:** Shared types in `lib/quiz-data.ts` (Question, PoolQuiz, PoolData, etc.)
- **API:** Next.js App Router route handlers; Zod for validation
- **Chain config:** Two-tier — `lib/chains.ts` (viem chain definitions) + `lib/active-chain-config.ts` (app-level config with env vars)
- **Environment:** `NEXT_PUBLIC_*` vars exposed to browser; server-only vars prefixed without `NEXT_PUBLIC_`

### Smart Contract Address Management

Each chain has **two env vars** per contract — one for the QuizScores contract and one for the NFT contract. The naming convention is `NEXT_PUBLIC_CONTRACT_ADDRESS_{CHAIN}` and `NEXT_PUBLIC_NFT_CONTRACT_{CHAIN}`. For chains where the QuizScores contract was deployed before the "INK_MAINNET" suffix convention, there's a mix of `_MAINNET` and bare suffixes (see `lib/submitScore.ts` function `getContractAddress` for the authoritative mapping).

---

*End of application overview. This document was automatically generated from the codebase.*
