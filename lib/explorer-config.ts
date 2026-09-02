// Explorer domain types, chain config, and pure helpers.
// Extracted from the original 2,149-line bubble-explorer.tsx so the
// component only owns UI state/rendering.
import { formatUnits } from 'viem'

export const SEARCH_TYPES = {
  TX_HASH: /^0x[a-fA-F0-9]{64}$/i,
  ADDRESS: /^0x[a-fA-F0-9]{40}$/i,
  ENS: /\.eth$/i,
  BLOCK: /^\d+$/,
}

export type ChainType = 'soneium' | 'ink' | 'base' | 'unichain' | 'megaeth' | 'litvm' | 'arc' | 'sepolia'

export interface DefiProtocol {
  name: string
  address: string
  type: 'swap' | 'lend' | 'borrow'
}

export interface ChainConfig {
  apiBase: string
  color: string
  name: string
  explorer: string
  currency: string
  decimals: number
  whaleThreshold: number
  freezeMonitoredContracts?: string[]
  defiProtocols?: DefiProtocol[]
  rpcUrl?: string
}

export const CHAIN_CONFIG: Record<ChainType, ChainConfig> = {
  soneium: {
    apiBase: 'https://soneium.blockscout.com/api/v2',
    color: '#0047FF',
    name: 'Soneium',
    explorer: 'https://soneium.blockscout.com',
    currency: 'ETH',
    decimals: 18,
    whaleThreshold: 10,
  },
  ink: {
    apiBase: 'https://explorer.inkonchain.com/api/v2',
    color: '#8b5cf6',
    name: 'Ink',
    explorer: 'https://explorer.inkonchain.com',
    currency: 'ETH',
    decimals: 18,
    whaleThreshold: 10,
  },
  base: {
    apiBase: 'https://base.blockscout.com/api/v2',
    color: '#0052ff',
    name: 'Base',
    explorer: 'https://base.blockscout.com',
    currency: 'ETH',
    decimals: 18,
    whaleThreshold: 10,
  },
  unichain: {
    apiBase: 'https://unichain.blockscout.com/api/v2',
    color: '#ff007a',
    name: 'Unichain',
    explorer: 'https://unichain.blockscout.com',
    currency: 'ETH',
    decimals: 18,
    whaleThreshold: 10,
  },
  megaeth: {
    apiBase: 'https://megaeth.blockscout.com/api/v2',
    color: '#00ff88',
    name: 'MegaETH',
    explorer: 'https://megaeth.blockscout.com',
    currency: 'ETH',
    decimals: 18,
    whaleThreshold: 10,
  },
  litvm: {
    apiBase: 'https://liteforge.explorer.caldera.xyz/api/v2',
    rpcUrl: 'https://liteforge.rpc.caldera.xyz/infra-partner-http',
    color: '#00F2FE',
    name: 'LitVM',
    explorer: 'https://liteforge.explorer.caldera.xyz',
    currency: 'zkLTC',
    decimals: 18,
    whaleThreshold: 10,
  },
  arc: {
    apiBase: 'https://testnet.arcscan.app/api/v2',
    color: '#4D8EE9',
    name: 'Arc Testnet',
    explorer: 'https://testnet.arcscan.app',
    currency: 'USDC',
    decimals: 18,
    whaleThreshold: 10000,
  },
  sepolia: {
    apiBase: 'https://eth-sepolia.blockscout.com/api/v2',
    color: '#0047FF',
    name: 'Sepolia',
    explorer: 'https://eth-sepolia.blockscout.com',
    currency: 'ETH',
    decimals: 18,
    whaleThreshold: 10,
  },
}

export type FilterType = 'all' | 'transfers' | 'contract_calls' | 'token_transfers' | 'nfts'

export interface TxData {
  hash: string
  value: string
  from: { hash: string }
  to: { hash: string } | null
  transaction_types: string[]
  token_transfers?: { token: { type: string } }[]
  gas_used: string
  timestamp: string
}

export type ActiveSearch = {
  type: 'address' | 'tx' | 'block' | 'search';
  query: string;
  address?: string;
  addressData?: any;
  addressTxs?: TxData[];
  txData?: any;
  blockData?: any;
  blockTxs?: TxData[];
  searchItems?: any[];
} | null;

export interface Bubble {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  tx: TxData
  targetOpacity: number
  currentOpacity: number
  isDragging?: boolean
}

export interface Ripple {
  bubbleId: string
  startTime: number
  color: string
}

// ─── Pure helpers ─────────────────────────────────────────────

export function getTxPrimaryType(tx: TxData) {
  const types = tx.transaction_types || []
  const transfers = tx.token_transfers || []

  const isNFT =
    transfers.some(t => ['ERC-721', 'ERC-1155'].includes(t.token?.type)) ||
    types.some(t => ['ERC-721', 'ERC-1155', 'nft_transfer'].includes(t))

  const isToken =
    transfers.some(t => t.token?.type === 'ERC-20') ||
    types.some(t => ['ERC-20', 'token_transfer'].includes(t))

  if (isNFT) return 'nft_transfer'
  if (isToken) return 'token_transfer'
  if (types.some(t => ['contract_call', 'contract_creation'].includes(t))) return 'contract_call'
  if (types.some(t => ['coin_transfer', 'native_transfer'].includes(t))) return 'coin_transfer'
  return 'default'
}

export function getTypeColor(type: string, chainColor: string) {
  switch (type) {
    case 'coin_transfer': return chainColor
    case 'contract_call': return '#22c55e'
    case 'token_transfer': return '#f97316'
    case 'nft_transfer': return '#a855f7'
    default: return '#888888'
  }
}

export function passesFilter(tx: TxData, filter: FilterType) {
  if (filter === 'all') return true
  const type = getTxPrimaryType(tx)
  if (filter === 'transfers') return type === 'coin_transfer'
  if (filter === 'contract_calls') return type === 'contract_call'
  if (filter === 'token_transfers') return type === 'token_transfer'
  if (filter === 'nfts') return type === 'nft_transfer'
  return false
}

export function truncateString(str: string, max = 8) {
  if (!str) return 'Contract Creation'
  if (str.length <= max) return str
  return `${str.slice(0, 4)}...${str.slice(-4)}`
}

export function getAddr(txField: any): string | null {
  if (!txField) return null
  if (typeof txField === 'string') return txField.toLowerCase()
  return txField.hash?.toLowerCase() || null
}

export function formatNativeValue(value: string | bigint, decimals: number): string {
  const val = typeof value === 'bigint' ? value : BigInt(value || '0')
  return formatUnits(val, decimals)
}

export function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}
