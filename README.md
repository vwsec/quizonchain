# Quiz On Chain

- **Live URL**: [https://quizonchain.vercel.app](https://quizonchain.vercel.app)
- **Twitter**: [https://x.com/quizonchain](https://x.com/quizonchain)
- **GitHub**: [https://github.com/vwsec/quizonchain](https://github.com/vwsec/quizonchain)

## Chain-Specific Deployments
| Chain | URL | Active Chain |
|:------|:----|:-------------|
| Ink | [quizonchain.vercel.app](https://quizonchain.vercel.app) | `NEXT_PUBLIC_ACTIVE_CHAIN=ink` |
| Ink | [quizonink.vercel.app](https://quizonink.vercel.app) | `NEXT_PUBLIC_ACTIVE_CHAIN=ink` |
| Soneium | [quizonsoneium.vercel.app](https://quizonsoneium.vercel.app) | `NEXT_PUBLIC_ACTIVE_CHAIN=soneium` |
| Base | [quizonbase.vercel.app](https://quizonbase.vercel.app) | `NEXT_PUBLIC_ACTIVE_CHAIN=base` |
| Unichain | [quizonunichain.vercel.app](https://quizonunichain.vercel.app) | `NEXT_PUBLIC_ACTIVE_CHAIN=unichain` |
| MegaETH | [quizonmegaeth.vercel.app](https://quizonmegaeth.vercel.app) | `NEXT_PUBLIC_ACTIVE_CHAIN=megaeth` |

## Description
Quiz On Chain is a Web3 quiz app about blockchain ecosystems.
Players connect their wallet, answer 5 questions sourced from
official blockchain documentation, and save their score
permanently on-chain. Reach 100 points on any chain to mint
an exclusive NFT.

## Features
- 5 questions per quiz sourced from official blockchain documentation
- Scores submitted on-chain via smart contract with ECDSA signature verification
- Answer feedback shown after each question
- 1 hour cooldown between on-chain submissions
- Global leaderboard tracking total points across all players
- Per-chain leaderboards: Ink, Soneium, Base, Unichain, MegaETH
- NFT mint unlocked at 100 total points per chain
- Visual bubble explorer — live transactions shown as floating bubbles
- Network view — standard transaction table explorer
- Address and transaction search powered by Blockscout API
- Telegram alerts — real-time high-value transaction monitoring
- Single-chain deployment mode via `NEXT_PUBLIC_ACTIVE_CHAIN`
- Free to play, open to everyone

## Supported Networks
| Network  | Chain ID | Explorer |
|:---------|:---------|:---------|
| Ink      | 57073    | [explorer.inkonchain.com](https://explorer.inkonchain.com) |
| Soneium  | 1868     | [soneium.blockscout.com](https://soneium.blockscout.com) |
| Base     | 8453     | [base.blockscout.com](https://base.blockscout.com) |
| Unichain | 130      | [unichain.blockscout.com](https://unichain.blockscout.com) |
| MegaETH  | 4326     | [megaeth.blockscout.com](https://megaeth.blockscout.com) |

## Smart Contract Addresses

### QuizScores Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167` |
| Soneium  | `0xFcd6909EFAC729DC901775895f3322f8050c7c73` |
| Base     | `0xCc8Fc975715388171eCAa93A27313379Bd25D881` |
| Unichain | `0x1f42B65a9C1f873D26881217E86E09e1470A3c6C` |
| MegaETH  | `0xd493bb9fadd6226ba1c7ff1b524527855782163e` |

### QuizNFT Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x1328C30B73B90DcD59B26D513275644c8B34Ad6d` |
| Soneium  | `0x606a662Aa2Cd6d928A939768a2DB73E09B25eF48` |
| Base     | `0xBD99520780Dce2BfC79d29C044ADf88f449Ecf55` |
| Unichain | `0x88baBdA85F78eE6dcF63e0bBc78618008F1Fc9E8` |

## Tech Stack
- **Framework**: Next.js 14 (App Router), React 19
- **Wallet**: RainbowKit, wagmi v2, viem
- **Smart Contracts**: Solidity ^0.8.20, OpenZeppelin, Hardhat
- **Quiz Generation**: Groq SDK (llama-3.3-70b-versatile), Jina Reader
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
| `/explorer` | Chain selection for bubble explorer |
| `/explorer/[chain]` | Live transaction bubble visualization |
| `/explorer/[chain]/[address]` | Address network view |
| `/explorer/[chain]/tx/[hash]` | Transaction detail page |
| `/docs` | App documentation |
| `/support` | Contact and support |

## Environment Variables
```env
# AI & Quiz
GROQ_API_KEY=
QUIZ_JWT_SECRET=
QUIZ_SIGNER_PRIVATE_KEY=

# Wallet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Deployer (Hardhat only)
PRIVATE_KEY=

# Single-chain deployment (optional)
# Values: ink | soneium | base | unichain | megaeth
NEXT_PUBLIC_ACTIVE_CHAIN=

# App URL
NEXT_PUBLIC_APP_URL=https://quizonchain.vercel.app

# QuizScores Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS_INK=0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167
NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM=0xFcd6909EFAC729DC901775895f3322f8050c7c73
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=0xCc8Fc975715388171eCAa93A27313379Bd25D881
NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN=0x1f42B65a9C1f873D26881217E86E09e1470A3c6C
NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH=0xd493bb9fadd6226ba1c7ff1b524527855782163e

# QuizNFT Contract Addresses
NEXT_PUBLIC_NFT_CONTRACT_INK=0x1328C30B73B90DcD59B26D513275644c8B34Ad6d
NEXT_PUBLIC_NFT_CONTRACT_SONEIUM=0x606a662Aa2Cd6d928A939768a2DB73E09B25eF48
NEXT_PUBLIC_NFT_CONTRACT_BASE=0xBD99520780Dce2BfC79d29C044ADf88f449Ecf55
NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN=0x88baBdA85F78eE6dcF63e0bBc78618008F1Fc9E8

# NFT Settings
NEXT_PUBLIC_NFT_POINTS_THRESHOLD=100
```

## Single-Chain Deployment

When `NEXT_PUBLIC_ACTIVE_CHAIN` is set, the app locks to one chain:

```env
NEXT_PUBLIC_ACTIVE_CHAIN=ink
```

This changes:
- App title → "Quiz On Ink"
- Questions sourced only from Ink documentation
- Only Ink contract used for score submission
- Only Ink leaderboard shown
- Explorer goes directly to Ink explorer
- Chain-specific theme applied (Ink=purple, Soneium=blue, Base=blue, Unichain=pink, MegaETH=green)

## How It Works

1. **Quiz generation** — Groq fetches docs via Jina Reader, generates 5 questions, returns a signed JWT containing correct answers (prevents client-side cheating)
2. **Answer verification** — `/api/verify-quiz` verifies the JWT and returns the score
3. **Score signing** — `/api/sign-score` signs the score with `QUIZ_SIGNER_PRIVATE_KEY` using ECDSA
4. **On-chain submission** — User submits score + signature to `QuizScores.sol` which verifies via `ECDSA.recover`
5. **NFT mint** — After 100 total points, `QuizNFT.sol` allows one mint per address per chain

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
