import { isAddress } from "viem"

const contractEnvKeys = [
  "NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET",
  "NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET",
  "NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET",
  "NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN",
] as const

export function validateContractAddressEnv() {
  for (const key of contractEnvKeys) {
    const value = process.env[key]
    const trimmed = value?.trim() ?? ""
    const validShape = trimmed.length === 42 && trimmed.startsWith("0x")
    if (!trimmed || !validShape || !isAddress(trimmed)) {
      console.debug(`[env] ${key} is missing or invalid.`)
    }
  }
}

