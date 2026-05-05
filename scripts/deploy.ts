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

  const QuizScores = await hre.ethers.getContractFactory("QuizScores")
  const quizScores = await QuizScores.deploy()
  await quizScores.waitForDeployment()

  const address = await quizScores.getAddress()
  console.debug("QuizScores deployed to:", address)

  if (net === "soneiumMinato") {
    console.debug("\nSet in .env.local:")
    console.debug(`NEXT_PUBLIC_CONTRACT_ADDRESS_MINATO=${address}`)
  } else if (net === "soneiumMainnet") {
    console.debug("\nSet in .env.local:")
    console.debug(`NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=${address}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
