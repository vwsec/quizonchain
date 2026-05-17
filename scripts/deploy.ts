import { config as dotenvConfig } from "dotenv"

dotenvConfig({ path: ".env" })
dotenvConfig({ path: ".env.local", override: true })

import hre from "hardhat"

async function main() {
  const pk = process.env.PRIVATE_KEY?.trim()
  if (!pk) {
    throw new Error(
      "PRIVATE_KEY is not set. Add it to .env or .env.local (hex, with or without 0x prefix).",
    )
  }

  const net = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  console.debug(`Network: ${net} (chainId ${hre.network.config.chainId})`)
  console.debug("Deploying QuizScores with:", deployer.address)

  const signerPk = process.env.QUIZ_SIGNER_PRIVATE_KEY?.trim()
  if (!signerPk) {
    throw new Error("QUIZ_SIGNER_PRIVATE_KEY is not set.")
  }

  const signerWallet = new hre.ethers.Wallet(signerPk.startsWith("0x") ? signerPk : `0x${signerPk}`)
  const initialTrustedSigner = signerWallet.address
  console.debug("Trusted signer address:", initialTrustedSigner)

  const QuizScores = await hre.ethers.getContractFactory("QuizScores")
  const quizScores = await QuizScores.deploy(initialTrustedSigner)
  await quizScores.waitForDeployment()

  const address = await quizScores.getAddress()
  console.debug("QuizScores deployed to:", address)

  const chainVarMap: Record<number, string> = {
    1868: "NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM",
    57073: "NEXT_PUBLIC_CONTRACT_ADDRESS_INK",
    8453: "NEXT_PUBLIC_CONTRACT_ADDRESS_BASE",
    130: "NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN",
    4326: "NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH",
    4441: "NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM",
  }

  const chainId = hre.network.config.chainId
  const varName = chainId ? chainVarMap[chainId] : undefined
  if (varName) {
    console.debug("\nSet in .env.local:")
    console.debug(`${varName}=${address}`)
  } else {
    console.debug("\nDeployed to unknown network. Set the appropriate env var in .env.local:")
    console.debug(`NEXT_PUBLIC_CONTRACT_ADDRESS_<NETWORK>=${address}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
