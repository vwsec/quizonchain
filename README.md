# Quiz On Chain

- **Live URL**: [https://quizonchain.vercel.app](https://quizonchain.vercel.app)
- **Twitter**: [https://x.com/quizonchain](https://x.com/quizonchain)
- **GitHub**: [https://github.com/vwsec/quizonchain](https://github.com/vwsec/quizonchain)

## Description
Quiz On Chain is a Web3 quiz app about blockchain ecosystems. 
Players connect their wallet, answer 5 questions sourced from 
official blockchain documentation, and save their score 
permanently on-chain. Reach 100 points on any chain to mint 
an exclusive NFT.

## Features
- 5 questions per quiz sourced from official blockchain documentation
- Scores submitted on-chain via smart contract
- Answer feedback shown after each question
- 1 hour cooldown between on-chain submissions
- Global leaderboard tracking total points across all players
- Per-chain leaderboards: Ink, Soneium, Base, Unichain
- NFT mint unlocked at 100 total points per chain
- Visual bubble explorer — live transactions shown as floating bubbles
- Address and transaction search powered by Blockscout API
- Free to play, open to everyone

## Supported Networks
| Network  | Chain ID | Explorer |
|:---------|:---------|:---------|
| Ink      | 57073    | [explorer.inkonchain.com](https://explorer.inkonchain.com) |
| Soneium  | 1868     | [soneium.blockscout.com](https://soneium.blockscout.com) |
| Base     | 8453     | [basescan.org](https://basescan.org) |
| Unichain | 130      | [uniscan.xyz](https://uniscan.xyz) |

## Smart Contract Addresses

### QuizScores Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x9dAB945F67b53ffCb78f02B1Dd31B731f69e1167` |
| Soneium  | `0xFcd6909EFAC729DC901775895f3322f8050c7c73` |
| Base     | `0xCc8Fc975715388171eCAa93A27313379Bd25D881` |
| Unichain | `0x1f42B65a9C1f873D26881217E86E09e1470A3c6C` |

### QuizNFT Contracts
| Network  | Address |
|:---------|:--------|
| Ink      | `0x1328C30B73B90DcD59B26D513275644c8B34Ad6d` |
| Soneium  | `0x606a662Aa2Cd6d928A939768a2DB73E09B25eF48` |
| Base     | `0xBD99520780Dce2BfC79d29C044ADf88f449Ecf55` |
| Unichain | `0x88baBdA85F78eE6dcF63e0bBc78618008F1Fc9E8` |

## Tech Stack
- **Framework**: Next.js 16, React 19
- **Wallet**: RainbowKit, wagmi v2, viem
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Styling**: Tailwind CSS, shadcn/ui, Lucide React
- **Explorer API**: Blockscout REST API
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
GROQ_API_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
SIGNER_PRIVATE_KEY=
NEXT_PUBLIC_CONTRACT_ADDRESS_INK=
NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM=
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=
NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN=
NEXT_PUBLIC_NFT_CONTRACT_INK=
NEXT_PUBLIC_NFT_CONTRACT_SONEIUM=
NEXT_PUBLIC_NFT_CONTRACT_BASE=
NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN=
NEXT_PUBLIC_NFT_POINTS_THRESHOLD=100
```

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

3. Create `.env.local` and add the required environment variables.

4. Run the development server:
```bash
   npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## License
MIT