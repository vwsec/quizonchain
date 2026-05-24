import {
  BaseError,
  concatHex,
  type Address,
  type Hex,
  type PublicClient,
  isAddress,
} from 'viem'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import {
  inkMainnet,
  soneiumMainnet,
  base,
  unichain,
  megaEth,
  litvmTestnet,
  arcTestnet,
  sepoliaTestnet,
} from '@/lib/chains'

const CHAIN_MAINNET = 1868
const CHAIN_INK_MAINNET = 57073
const CHAIN_BASE_MAINNET = 8453
const CHAIN_UNICHAIN_MAINNET = 130
const CHAIN_MEGAETH_MAINNET = 4326
const CHAIN_LITVM_TESTNET = 4441
const CHAIN_ARC_TESTNET = 5042002
const CHAIN_SEPOLIA_TESTNET = 11155111

export const quizScoresAbi = [
  {
    inputs: [
      { internalType: 'uint8', name: 'score', type: 'uint8' },
      { internalType: 'uint8', name: 'total', type: 'uint8' },
      { internalType: 'bytes', name: 'sig', type: 'bytes' },
    ],
    name: 'submitScore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'nonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getTimeUntilNextSubmission',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLeaderboard',
    outputs: [
      { internalType: 'address[]', name: 'addrs', type: 'address[]' },
      { internalType: 'uint256[]', name: 'points', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'games', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'totalPoints',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'totalGames',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'player',
        type: 'address',
      },
      { indexed: false, internalType: 'uint8', name: 'score', type: 'uint8' },
      { indexed: false, internalType: 'uint8', name: 'total', type: 'uint8' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'ScoreSubmitted',
    type: 'event',
  },
] as const

export type SubmitScoreSuccess = { success: true; hash: Hex }
export type SubmitScoreFailure = { success: false; error: string; hash?: `0x${string}` }
export type SubmitScoreResult = SubmitScoreSuccess | SubmitScoreFailure

function formatError(err: unknown): string {
  if (err instanceof BaseError) {
    const head = err.shortMessage || err.message
    const detail = err.details
    if (detail && detail !== head && !head.includes(detail)) {
      return `${head}: ${detail}`
    }
    return head
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Unknown error'
}

/** Chain IDs supported by the quiz contracts. */

function getContractAddress(chainId: number): Address | SubmitScoreFailure {
  if (chainId === CHAIN_MAINNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET
    if (!raw?.trim()) {
      return {
        success: false,
        error:
          'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET is not configured for this build.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid mainnet contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_INK_MAINNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET
    if (!raw?.trim()) {
      return {
        success: false,
        error:
          'NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET is not configured for this build.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid Ink mainnet contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_BASE_MAINNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET
    if (!raw?.trim()) {
      return {
        success: false,
        error:
          'NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET is not configured for this build.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid Base mainnet contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_UNICHAIN_MAINNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN
    if (!raw?.trim()) {
      return {
        success: false,
        error:
          'NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN is not configured for this build.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid Unichain contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_MEGAETH_MAINNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH
    if (!raw?.trim()) {
      return {
        success: false,
        error:
          'NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH is not configured for this build.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid MegaETH contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_LITVM_TESTNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM
    if (!raw?.trim()) {
      return {
        success: false,
        error:
          'Invalid LitVM contract address in env.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid LitVM contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_ARC_TESTNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC
    if (!raw?.trim()) {
      return {
        success: false,
        error: 'NEXT_PUBLIC_CONTRACT_ADDRESS_ARC is not configured for this build.',
      }
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid Arc Testnet contract address in env.',
      }
    }
    return addr
  }
  if (chainId === CHAIN_SEPOLIA_TESTNET) {
    const raw = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA ?? '0xe91E1FeA7652F0eb2A9A266FD5ae52AFB912729e'
    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA) {
      console.warn('[QuizOnChain] NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA not set, using hardcoded fallback')
    }
    const addr = raw.trim() as Address
    if (!isAddress(addr)) {
      return {
        success: false,
        error: 'Invalid Sepolia contract address in env.',
      }
    }
    return addr
  }
  return {
    success: false,
    error: `Unsupported chain (${chainId}). Use one of: Soneium (${CHAIN_MAINNET}), Ink (${CHAIN_INK_MAINNET}), Base (${CHAIN_BASE_MAINNET}), Unichain (${CHAIN_UNICHAIN_MAINNET}), MegaETH (${CHAIN_MEGAETH_MAINNET}), LitVM (${CHAIN_LITVM_TESTNET}), Arc (${CHAIN_ARC_TESTNET}), Sepolia (${CHAIN_SEPOLIA_TESTNET}).`,
  }
}

function isSubmitScoreFailure(
  value: Address | SubmitScoreFailure,
): value is SubmitScoreFailure {
  return typeof value === 'object' && value !== null && 'success' in value
}

function getViemChain(chainId: number) {
  if (chainId === CHAIN_MAINNET) return soneiumMainnet
  if (chainId === CHAIN_INK_MAINNET) return inkMainnet
  if (chainId === CHAIN_BASE_MAINNET) return base
  if (chainId === CHAIN_UNICHAIN_MAINNET) return unichain
  if (chainId === CHAIN_MEGAETH_MAINNET) return megaEth
  if (chainId === CHAIN_LITVM_TESTNET) return litvmTestnet
  if (chainId === CHAIN_ARC_TESTNET) return arcTestnet
  if (chainId === CHAIN_SEPOLIA_TESTNET) return sepoliaTestnet
  return null
}

function validateScoreInputs(score: number, total: number): string | null {
  if (!Number.isInteger(score) || !Number.isInteger(total)) {
    return 'Score and total must be whole numbers.'
  }
  if (score < 0 || score > 255 || total < 0 || total > 255) {
    return 'Score and total must be between 0 and 255.'
  }
  if (total === 0) {
    return 'Total must be greater than zero.'
  }
  if (score > total) {
    return 'Score cannot exceed total.'
  }
  return null
}

async function fetchScoreSignature(
  playerAddress: Address,
  score: number,
  total: number,
  nonce: number,
  chainId: number,
  contractAddress: Address,
  quizToken?: string,
  userAnswers?: number[],
): Promise<Hex> {
  const payload = { playerAddress, score, total, nonce, chainId, contractAddress, quizToken, answers: userAnswers }
  
  const res = await fetch('/api/sign-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sign API error ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = (await res.json()) as { signature?: string; error?: string }
  if (!data.signature) {
    throw new Error(data.error ?? 'Failed to fetch score signature')
  }
  return data.signature as Hex
}

export type SubmitScoreOptions = {
  /** Explicit chain ID to use (e.g. from `useChainId`). */
  chainId?: number
}

export function getContractAddressPreview(chainId: number): string | null {
  const addressOrErr = getContractAddress(chainId)
  if (isSubmitScoreFailure(addressOrErr)) {
    return null
  }
  return addressOrErr
}

export async function getTimeUntilNextSubmissionSeconds(params: {
  chainId: number
  player: Address
  publicClient: PublicClient | undefined
}): Promise<number> {
  const addressOrErr = getContractAddress(params.chainId)
  if (isSubmitScoreFailure(addressOrErr)) return 0
  if (!params.publicClient) return 0

  try {
    const value = await params.publicClient.readContract({
      address: addressOrErr,
      abi: quizScoresAbi,
      functionName: 'getTimeUntilNextSubmission',
      args: [params.player],
    })
    return Number(value)
  } catch {
    return 0
  }
}

export async function estimateSubmitScoreGas(params: {
  chainId: number
  player: Address
  score: number
  total: number
  publicClient: PublicClient | undefined
}): Promise<bigint | null> {
  const addressOrErr = getContractAddress(params.chainId)
  if (isSubmitScoreFailure(addressOrErr)) return null
  const viemChain = getViemChain(params.chainId)
  if (!viemChain || !params.publicClient) return null
  try {
    // Placeholder 65-byte signature for rough gas estimate.
    const placeholderSig = concatHex([
      '0x',
      `0x${'00'.repeat(32)}`,
      `0x${'00'.repeat(32)}`,
      '0x1b',
    ])
    return await params.publicClient.estimateContractGas({
      address: addressOrErr,
      abi: quizScoresAbi,
      functionName: 'submitScore',
      args: [params.score, params.total, placeholderSig],
      account: params.player,
    })
  } catch {
    return null
  }
}

/**
 * Hook for submitting a quiz score on-chain using wagmi v2 hooks.
 * Chooses contract env by selected chain:
 * - 1868: NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET
 * - 57073: NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET
 * - 8453: NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET
 * - 130: NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN
 */
export function useSubmitScore() {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { chain, address } = useAccount()

  return async (
    params: { score: number; total: number; quizToken?: string; userAnswers?: number[] },
    options?: SubmitScoreOptions,
  ): Promise<SubmitScoreResult> => {
    const validationError = validateScoreInputs(params.score, params.total)
    if (validationError) {
      return { success: false, error: validationError }
    }

    const chainId = options?.chainId ?? chain?.id
    if (chainId == null) {
      return {
        success: false,
        error: 'No chain selected for score submission.',
      }
    }

    const addressOrErr = getContractAddress(chainId)
    if (isSubmitScoreFailure(addressOrErr)) {
      return addressOrErr
    }

    const viemChain = getViemChain(chainId)
    if (!viemChain) {
      return {
        success: false,
        error: `No viem chain definition for chain ID ${chainId}.`,
      }
    }

    try {
      if (!walletClient) {
        throw new Error('Wallet not connected')
      }
      if (!publicClient) {
        throw new Error('Public client is not available')
      }
      const walletClientAddress = walletClient.account?.address
      if (
        !address ||
        !walletClientAddress ||
        walletClientAddress.toLowerCase() !== address.toLowerCase()
      ) {
        throw new Error('Wallet account mismatch. Reconnect your wallet and try again.')
      }

      // Get the correct nonce for this player
      const nonce = await publicClient.readContract({
        address: addressOrErr,
        abi: quizScoresAbi,
        functionName: 'nonces',
        args: [walletClient.account.address],
      }) as bigint

      const hash = await walletClient.writeContract({
        address: addressOrErr,
        abi: quizScoresAbi,
        functionName: 'submitScore',
        args: [
          params.score,
          params.total,
          await fetchScoreSignature(
            walletClient.account.address,
            params.score,
            params.total,
            Number(nonce),
            chainId,
            addressOrErr,
            params.quizToken,
            params.userAnswers,
          ),
        ],
        chain: viemChain,
        account: walletClient.account,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status !== 'success') {
        return {
          success: false,
          error: `Transaction reverted on-chain. Hash: ${hash}`,
          hash,
        }
      }

      return { success: true, hash }
    } catch (err) {
      return { success: false, error: formatError(err) }
    }
  }
}
