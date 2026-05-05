import { config as dotenvConfig } from "dotenv"
import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
dotenvConfig({ path: ".env" })
dotenvConfig({ path: ".env.local", override: true })
function normalizePrivateKey(key: string | undefined): string[] {
  if (!key?.trim()) return []
  const trimmed = key.trim()
  const withPrefix = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`
  return [withPrefix]
}
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    soneiumMinato: {
      url: "https://rpc.minato.soneium.org",
      chainId: 1946,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    soneiumMainnet: {
      url: "https://rpc.soneium.org",
      chainId: 1868,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    inkonchain: {
      url: "https://rpc-gel.inkonchain.com",
      chainId: 57073,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
  },
  etherscan: {
    apiKey: {
      inkonchain: "empty",
    },
    customChains: [
      {
        network: "inkonchain",
        chainId: 57073,
        urls: {
          apiURL: "https://explorer.inkonchain.com/api",
          browserURL: "https://explorer.inkonchain.com",
        },
      },
    ],
  },
}
export default config