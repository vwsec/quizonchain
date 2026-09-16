import { config as dotenvConfig } from "dotenv"

dotenvConfig({ path: ".env" })
dotenvConfig({ path: ".env.local", override: true })

import hre from "hardhat"

const chainScoresVar: Record<number, string> = {
  1868: "NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM",
  57073: "NEXT_PUBLIC_CONTRACT_ADDRESS_INK",
  8453: "NEXT_PUBLIC_CONTRACT_ADDRESS_BASE",
  130: "NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN",
  4326: "NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH",
   4441: "NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM",
   5042002: "NEXT_PUBLIC_CONTRACT_ADDRESS_ARC",
   5042: "NEXT_PUBLIC_CONTRACT_ADDRESS_ARC_MAINNET",
   11155111: "NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA",
   2741: "NEXT_PUBLIC_CONTRACT_ADDRESS_ABSTRACT",
}

const chainNftVar: Record<number, string> = {
   1868: "NEXT_PUBLIC_NFT_CONTRACT_SONEIUM",
   57073: "NEXT_PUBLIC_NFT_CONTRACT_INK",
   8453: "NEXT_PUBLIC_NFT_CONTRACT_BASE",
   130: "NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN",
   4326: "NEXT_PUBLIC_NFT_CONTRACT_MEGAETH",
   4441: "NEXT_PUBLIC_NFT_CONTRACT_LITVM",
   5042002: "NEXT_PUBLIC_NFT_CONTRACT_ARC",
   5042: "NEXT_PUBLIC_NFT_CONTRACT_ARC_MAINNET",
   11155111: "NEXT_PUBLIC_NFT_CONTRACT_SEPOLIA",
   2741: "NEXT_PUBLIC_NFT_CONTRACT_ABSTRACT",
}

const chainUriMap: Record<number, string> = {
  1868: "https://quizonchain.com/nft/soneium",
  57073: "https://quizonchain.com/nft/ink",
  8453: "https://quizonchain.com/nft/base",
  130: "https://quizonchain.com/nft/unichain",
  4326: "https://quizonchain.com/nft/megaeth",
   4441: "https://quizonchain.com/nft/litvm",
   5042002: "https://quizonchain.com/nft/arc",
   5042: "https://quizonchain.com/nft/arc-mainnet",
   11155111: "https://quizonchain.com/nft/sepolia",
   2741: "https://quizonchain.com/nft/abstract",
}

async function main() {
  const pk = process.env.PRIVATE_KEY?.trim()
  if (!pk) {
    throw new Error("PRIVATE_KEY is not set.")
  }

  const net = hre.network.name
  const chainId = hre.network.config.chainId
  if (!chainId) {
    throw new Error("Unknown chain ID")
  }

  const scoresVar = chainScoresVar[chainId]
  const nftVar = chainNftVar[chainId]
  const baseURI = chainUriMap[chainId]
  if (!scoresVar || !nftVar || !baseURI) {
    throw new Error(`Unsupported chain: ${net} (${chainId})`)
  }

  const quizScoresAddress = process.env[scoresVar]
  if (!quizScoresAddress) {
    throw new Error(`${scoresVar} is not set in .env.local`)
  }

  const [deployer] = await hre.ethers.getSigners()
  console.debug(`Network: ${net} (chainId ${chainId})`)
  console.debug("Deploying QuizNFT with:", deployer.address)
  console.debug("QuizScores contract:", quizScoresAddress)
  console.debug("Base URI:", baseURI)
  console.debug("Points threshold: 100")

  const QuizNFT = await hre.ethers.getContractFactory("QuizNFT")
  const quizNFT = await QuizNFT.deploy(
    quizScoresAddress,
    baseURI,
    100,
  )
  await quizNFT.waitForDeployment()

  const address = await quizNFT.getAddress()
  console.debug("QuizNFT deployed to:", address)

  console.debug("\nSet in .env.local:")
  console.debug(`${nftVar}=${address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
