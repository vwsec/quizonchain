import { config as dotenvConfig } from "dotenv"

dotenvConfig({ path: ".env" })
dotenvConfig({ path: ".env.local", override: true })

import hre from "hardhat"

// Hardcoded map for the correct folder paths
const chainUriMap: Record<number, string> = {
  1868: "https://quizonchain.com/nft/soneium", // Soneium
  57073: "https://quizonchain.com/nft/ink",     // Ink
  8453: "https://quizonchain.com/nft/base",      // Base
  130: "https://quizonchain.com/nft/unichain",   // Unichain
  4326: "https://quizonchain.com/nft/megaeth",   // MegaETH
}

async function main() {
  const pk = process.env.PRIVATE_KEY?.trim()
  if (!pk) {
    throw new Error("PRIVATE_KEY is not set.")
  }

  const [deployer] = await hre.ethers.getSigners()
  console.debug(`Network: ${hre.network.name} (chainId ${hre.network.config.chainId})`)
  console.debug("Signer:", deployer.address)

  const chainId = hre.network.config.chainId
  if (!chainId || !chainUriMap[chainId]) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  // Get contract address based on environment variables
  // Since we don't have the lib directly accessible here if it depends on NEXT components,
  // we can just read the env variables.
  const contractAddresses: Record<number, string | undefined> = {
    1868: process.env.NEXT_PUBLIC_NFT_CONTRACT_SONEIUM,
    57073: process.env.NEXT_PUBLIC_NFT_CONTRACT_INK,
    8453: process.env.NEXT_PUBLIC_NFT_CONTRACT_BASE,
    130: process.env.NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN,
    4326: process.env.NEXT_PUBLIC_NFT_CONTRACT_MEGAETH,
  }

  const contractAddress = contractAddresses[chainId]
  if (!contractAddress) {
    throw new Error(`No NFT contract address configured for chain ${chainId}`)
  }

  console.log(`Contract to update: ${contractAddress}`)
  const newBaseURI = chainUriMap[chainId]
  console.log(`Setting baseTokenURI to: ${newBaseURI}`)

  const QuizNFT = await hre.ethers.getContractFactory("QuizNFT")
  const quizNFT = QuizNFT.attach(contractAddress)

  // Assuming it's an ethers v6 contract instance
  const tx = await (quizNFT as any).setBaseTokenURI(newBaseURI)
  console.log(`Tx sent: ${tx.hash}`)
  await tx.wait()
  console.log(`Base URI updated successfully!`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
