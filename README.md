# Quiz On Chain

- **Live URL**: [https://quizonchain.app](https://quizonchain.app)
- **Twitter**: [https://x.com/quizonchain](https://x.com/quizonchain)
- **GitHub**: [https://github.com/vwsec/quizonchain](https://github.com/vwsec/quizonchain)

## Deployment

Single Vercel deployment serving all supported chains from one URL:

| URL |
|:----|
| [https://quizonchain.app](https://quizonchain.app) |

## Description
Quiz On Chain is a Web3 quiz app about blockchain ecosystems.
Players connect their wallet, answer 5 questions sourced from
official blockchain documentation, and save their score
permanently on-chain. All 9 supported chains are available
from a single page — the app detects the connected wallet's
chain automatically and routes score submissions to the
corresponding smart contract. Reach 100 points on any chain
to mint an exclusive NFT.

## Features
- 5 questions per quiz sourced from official blockchain documentation
- Scores submitted on-chain via smart contract with ECDSA signature verification
- Answer feedback shown after each question
- 1 hour cooldown between on-chain submissions
- Global leaderboard tracking total points across all players
- Per-chain leaderboards: Ink, Soneium, Base, Unichain, MegaETH, LitVM, Arc, Sepolia, Abstract
- NFT mint unlocked at 100 total points per chain
- Free to play, open to everyone

## Supported Networks
| Network     | Chain ID | Explorer |
|:------------|:---------|:---------|
| Ink         | 57073    | [explorer.inkonchain.com](https://explorer.inkonchain.com) |
| Soneium     | 1868     | [soneium.blockscout.com](https://soneium.blockscout.com) |
| Base        | 8453     | [basescan.org](https://basescan.org) |
| Unichain    | 130      | [uniscan.xyz](https://uniscan.xyz) |
| MegaETH     | 4326     | [megaeth.blockscout.com](https://megaeth.blockscout.com) |
| LitVM       | 4441     | [liteforge.explorer.caldera.xyz](https://liteforge.explorer.caldera.xyz) |
| Arc Testnet | 5042002  | [testnet.arcscan.app](https://testnet.arcscan.app) |
| Sepolia     | 11155111 | [eth-sepolia.blockscout.com](https://eth-sepolia.blockscout.com) |
| Abstract    | 2741     | [abscan.org](https://abscan.org) |

## Smart Contract Addresses

### QuizScores Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167` |
| Soneium  | `0xFcd6909EFAC729DC901775895f3322f8050c7c73` |
| Base     | `0xCc8Fc975715388171eCAa93A27313379Bd25D881` |
| Unichain | `0xfEca7f467dA4E081B431E84cFd0b442dBd548e96` |
| MegaETH  | `0xd493bB9faDD6226ba1C7Ff1b524527855782163e` |
| LitVM    | `0xBEd500d8d59547269085BBB4fa32Fab4394a4802` |
| Arc      | `0x8F2F01a73837762b9EB083EB66b63e6B6808Bd40` |
| Sepolia  | `0xe91E1FeA7652F0eb2A9A266FD5ae52AFB912729e` |
| Abstract | TBD (not deployed yet) |

### QuizNFT Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x1328C30B73B90DcD59B26D513275644c8B34Ad6d` |
| Soneium  | `0x606a662Aa2Cd6d928A939768a2DB73E09B25eF48` |
| Base     | `0xBD99520780Dce2BfC79d29C044ADf88f449Ecf55` |
| Unichain | `0x88baBdA85F78eE6dcF63e0bBc78618008F1Fc9E8` |
| MegaETH  | `0x800a3843eE97e5e19468e3d62c19f9E93524A510` \* |
| LitVM    | `0x800a3843eE97e5e19468e3d62c19f9E93524A510` \* |
| Arc      | `0x734EAf28175E398778082caC79bBcdBccfe1c7bB` |
| Sepolia  | `0x6F98372246ba85199B58B5c07581e5Bb7DC77045` |
| Abstract | TBD (not deployed yet) |

\* Same contract address deployed on both chains.

## Tech Stack
- **Framework**: Next.js 15 (App Router), React 19
- **Wallet**: RainbowKit 2.2.11, wagmi v3, viem 2.49.0
- **Smart Contracts**: Solidity ^0.8.20, OpenZeppelin ^5.6.1, Hardhat ^2.28
- **Quiz Generation**: Pool-first — pre-generated verified questions per chain (`data/quizzes-*.json`), sequential per-wallet progress in Redis
- **Answer Security**: JWT (jose) — correct answers stored in signed token
- **Score Security**: ECDSA trusted signer pattern
- **Styling**: Tailwind CSS v4, shadcn/ui, Lucide React
- **Explorer API**: Blockscout REST API v2
- **Deployment**: Vercel

## Pages
| Route | Description |
|:------|:------------|
| `/` | Quiz home — start quiz, view progress toward NFT |
| `/leaderboard` | Global and per-chain leaderboards |
| `/docs` | App documentation |
| `/support` | Contact and support |

## Environment Variables
```env
# Quiz & Scoring
QUIZ_JWT_SECRET=                     # HMAC secret for signing quiz JWT tokens (jose)
QUIZ_SIGNER_PRIVATE_KEY=             # ECDSA private key for on-chain score signatures
SIGNER_PRIVATE_KEY=                  # Fallback for QUIZ_SIGNER_PRIVATE_KEY

# Wallet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Deployer (Hardhat only)
PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_DOMAIN=quizonchain.app
NEXT_PUBLIC_ACTIVE_CHAIN=            # Optional: pin single chain (ink/soneium/base/...)

# QuizScores Contract Addresses (Convention A — used by submitScore, leaderboard)
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=0xFcd6909EFAC729DC901775895f3322f8050c7c73
NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET=0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET=0xCc8Fc975715388171eCAa93A27313379Bd25D881

# QuizScores Contract Addresses (Convention B — used by active-chain-config)
NEXT_PUBLIC_CONTRACT_ADDRESS_INK=0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167
NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM=0xFcd6909EFAC729DC901775895f3322f8050c7c73
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=0xCc8Fc975715388171eCAa93A27313379Bd25D881
NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN=0xfEca7f467dA4E081B431E84cFd0b442dBd548e96
NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH=0xd493bB9faDD6226ba1C7Ff1b524527855782163e
NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM=0xBEd500d8d59547269085BBB4fa32Fab4394a4802
NEXT_PUBLIC_CONTRACT_ADDRESS_ARC=0x8F2F01a73837762b9EB083EB66b63e6B6808Bd40
NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=0xe91E1FeA7652F0eb2A9A266FD5ae52AFB912729e
NEXT_PUBLIC_CONTRACT_ADDRESS_ABSTRACT=  # TBD — not deployed yet

# QuizNFT Contract Addresses
NEXT_PUBLIC_NFT_CONTRACT_INK=0x1328C30B73B90DcD59B26D513275644c8B34Ad6d
NEXT_PUBLIC_NFT_CONTRACT_SONEIUM=0x606a662Aa2Cd6d928A939768a2DB73E09B25eF48
NEXT_PUBLIC_NFT_CONTRACT_BASE=0xBD99520780Dce2BfC79d29C044ADf88f449Ecf55
NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN=0x88baBdA85F78eE6dcF63e0bBc78618008F1Fc9E8
NEXT_PUBLIC_NFT_CONTRACT_MEGAETH=0x800a3843eE97e5e19468e3d62c19f9E93524A510
NEXT_PUBLIC_NFT_CONTRACT_LITVM=0x800a3843eE97e5e19468e3d62c19f9E93524A510
NEXT_PUBLIC_NFT_CONTRACT_ARC=0x734EAf28175E398778082caC79bBcdBccfe1c7bB
NEXT_PUBLIC_NFT_CONTRACT_SEPOLIA=0x6F98372246ba85199B58B5c07581e5Bb7DC77045
NEXT_PUBLIC_NFT_CONTRACT_ABSTRACT=  # TBD — not deployed yet

# NFT Settings
NEXT_PUBLIC_NFT_POINTS_THRESHOLD=100

# Base Builder Registry (for Base chain)
NEXT_PUBLIC_BASE_BUILDER_CODE=bc_oreav9tv
NEXT_PUBLIC_BASE_ENCODED_STRING=0x62635f6f726561763974760b0080218021802180218021802180218021

# Telegram Bot Alerts
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Block Explorer API Keys
BASESCAN_API_KEY=

# NVIDIA (optional, not actively used)
NVIDIA_API_KEY=
```

> **Note**: QuizScores addresses use two naming conventions that hold the same values. Convention A (`_MAINNET` suffix) is used by `lib/submitScore.ts` and `lib/chain-leaderboard.ts`. Convention B (short names) is used by `lib/active-chain-config.ts`.

## How It Works

1. **Connect wallet** — User connects any wallet (RainbowKit). The app detects the connected chain ID and loads the corresponding contract addresses, RPC endpoints, and theme.
2. **Quiz generation** — Server loads 5 pre-generated questions from the chain's pool (`data/quizzes-*.json`) and returns them with a JWT-sealed answer key (prevents client-side cheating). Wallet-bound sessions serve the next 5 pool questions sequentially (progress tracked in Redis); anonymous sessions get a random pick.
3. **Answer verification** — Score is computed locally (answer key ships in the questions payload) and re-verified server-side by `/api/sign-score` against the JWT before signing
4. **Score signing** — `/api/sign-score` signs the score with `QUIZ_SIGNER_PRIVATE_KEY` using ECDSA
5. **On-chain submission** — User submits score + signature to `QuizScores.sol` which verifies cooldown (1hr), score bounds, and signature via `ECDSA.recover`
6. **NFT mint** — After 100 total points per chain, `QuizNFT.sol` allows one mint per address per chain. `mint()` staticcalls `QuizScores.totalPoints(msg.sender)` to verify the threshold.

## Run Locally

1. Clone the repository:
```bash
git clone https://github.com/vwsec/quizonchain.git
cd quizonchain
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` and add the required environment variables listed above.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## License
MIT
