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
permanently on-chain. All 7 supported chains are available
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
- Per-chain leaderboards: Ink, Soneium, Base, Unichain, MegaETH, LitVM, Arc
- NFT mint unlocked at 100 total points per chain
- Visual bubble explorer — live transactions shown as floating bubbles
- Network view — standard transaction table explorer
- Address and transaction search powered by Blockscout API
- Telegram alerts — real-time high-value transaction monitoring
- Free to play, open to everyone

## Supported Networks
| Network  | Chain ID | Explorer |
|:---------|:---------|:---------|
| Ink      | 57073    | [explorer.inkonchain.com](https://explorer.inkonchain.com) |
| Soneium  | 1868     | [soneium.blockscout.com](https://soneium.blockscout.com) |
| Base     | 8453     | [base.blockscout.com](https://base.blockscout.com) |
| Unichain | 130      | [unichain.blockscout.com](https://unichain.blockscout.com) |
| MegaETH  | 4326     | [megaeth.blockscout.com](https://megaeth.blockscout.com) |
| LitVM    | 4441     | [liteforge.explorer.caldera.xyz](https://liteforge.explorer.caldera.xyz) |
| Arc      | 15789    | — |

## Smart Contract Addresses

### QuizScores Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167` |
| Soneium  | `0xFcd6909EFAC729DC901775895f3322f8050c7c73` |
| Base     | `0xCc8Fc975715388171eCAa93A27313379Bd25D881` |
| Unichain | `0xfEca7f467dA4E081B431E84cFd0b442dBd548e96` |
| MegaETH  | `0xd493bb9fadd6226ba1c7ff1b524527855782163e` |
| LitVM    | `0xBEd500d8d59547269085BBB4fa32Fab4394a4802` |
| Arc      | `0x8F2F01a73837762b9EB083EB66b63e6B6808Bd40` |
| Sepolia  | `0xe91E1FeA7652F0eb2A9A266FD5ae52AFB912729e` |

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

\* Same contract address deployed on both chains.

## Tech Stack
- **Framework**: Next.js 15 (App Router), React 19
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

# App URL
NEXT_PUBLIC_APP_URL=https://quizonchain.app

# QuizScores Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS_INK=0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167
NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM=0xFcd6909EFAC729DC901775895f3322f8050c7c73
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=0xCc8Fc975715388171eCAa93A27313379Bd25D881
NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN=0xfEca7f467dA4E081B431E84cFd0b442dBd548e96
NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH=0xd493bb9fadd6226ba1c7ff1b524527855782163e
NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM=0xBEd500d8d59547269085BBB4fa32Fab4394a4802
NEXT_PUBLIC_CONTRACT_ADDRESS_ARC=0x8F2F01a73837762b9EB083EB66b63e6B6808Bd40
NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA=0xe91E1FeA7652F0eb2A9A266FD5ae52AFB912729e

# QuizNFT Contract Addresses
NEXT_PUBLIC_NFT_CONTRACT_INK=0x1328C30B73B90DcD59B26D513275644c8B34Ad6d
NEXT_PUBLIC_NFT_CONTRACT_SONEIUM=0x606a662Aa2Cd6d928A939768a2DB73E09B25eF48
NEXT_PUBLIC_NFT_CONTRACT_BASE=0xBD99520780Dce2BfC79d29C044ADf88f449Ecf55
NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN=0x88baBdA85F78eE6dcF63e0bBc78618008F1Fc9E8
NEXT_PUBLIC_NFT_CONTRACT_MEGAETH=0x800a3843eE97e5e19468e3d62c19f9E93524A510
NEXT_PUBLIC_NFT_CONTRACT_LITVM=0x800a3843eE97e5e19468e3d62c19f9E93524A510
NEXT_PUBLIC_NFT_CONTRACT_ARC=0x734EAf28175E398778082caC79bBcdBccfe1c7bB
NEXT_PUBLIC_NFT_CONTRACT_SEPOLIA=0x6F98372246ba85199B58B5c07581e5Bb7DC77045

# NFT Settings
NEXT_PUBLIC_NFT_POINTS_THRESHOLD=100
```

## How It Works

1. **Connect wallet** — User connects any wallet (RainbowKit). The app detects the connected chain ID and loads the corresponding contract addresses, RPC endpoints, and theme.
2. **Quiz generation** — Groq fetches docs via Jina Reader, generates 5 questions, returns a signed JWT containing correct answers (prevents client-side cheating)
3. **Answer verification** — `/api/verify-quiz` verifies the JWT and returns the score
4. **Score signing** — `/api/sign-score` signs the score with `QUIZ_SIGNER_PRIVATE_KEY` using ECDSA
5. **On-chain submission** — User submits score + signature to `QuizScores.sol` which verifies via `ECDSA.recover`
6. **NFT mint** — After 100 total points, `QuizNFT.sol` allows one mint per address per chain

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
