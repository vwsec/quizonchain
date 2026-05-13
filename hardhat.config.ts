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
    baseMainnet: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    unichainMainnet: {
      url: "https://mainnet.unichain.org",
      chainId: 130,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    megaethMainnet: {
      url: "https://mainnet.megaeth.com/rpc",
      chainId: 4326,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
  },
  etherscan: {
    apiKey: {
      inkonchain: "empty",
      baseMainnet: process.env.BASESCAN_API_KEY || "",
      unichainMainnet: "empty",
      megaethMainnet: "empty",
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
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "unichainMainnet",
        chainId: 130,
        urls: {
          apiURL: "https://uniscan.xyz/api",
          browserURL: "https://uniscan.xyz",
        },
      },
      {
        network: "megaethMainnet",
        chainId: 4326,
        urls: {
          apiURL: "https://megaeth.blockscout.com/api",
          browserURL: "https://megaeth.blockscout.com",
        },
      },
    ],
  },
}
export default config