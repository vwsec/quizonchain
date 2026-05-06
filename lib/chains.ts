import { defineChain } from "viem"
import { base } from "wagmi/chains"


export const inkMainnet = defineChain({
  id: 57073,
  name: "Ink",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-gel.inkonchain.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ink Explorer",
      url: "https://explorer.inkonchain.com",
    },
  },
  testnet: false,
})

export const soneiumMainnet = defineChain({
  id: 1868,
  name: "Soneium",
  iconUrl: '/chains/soneium.png',
  iconBackground: "#ffffff",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.soneium.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Soneium Explorer",
      url: "https://soneium.blockscout.com",
    },
  },
  testnet: false,
})

export { base }

export const unichain = defineChain({
  id: 130,
  name: 'Unichain',
  iconUrl: '/chains/unichain.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.unichain.org'] } },
  blockExplorers: { default: { name: 'Uniscan', url: 'https://uniscan.xyz' } },
  iconBackground: '#F50DB4',
  testnet: false,
})

export const megaEth = defineChain({
  id: 4326,
  name: 'MegaETH',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.megaeth.com/rpc'] } },
  blockExplorers: { default: { name: 'MegaETH Explorer', url: 'https://megaexplorer.xyz' } },
  iconUrl: '/chains/megaeth.png',
});

export const soneiumChains = [
  inkMainnet,
  soneiumMainnet,
  base,
  unichain,
  megaEth,
] as const

export function getSoneiumChainById(chainId: number) {
  return soneiumChains.find((c) => c.id === chainId)
}

/** Internal explorer transaction URL for deep-linking. */
export function getTxInternalUrl(chainId: number, txHash: string): string {
  const mapping: Record<number, string> = {
    1868: 'soneium',
    57073: 'ink',
    8453: 'base',
    130: 'unichain',
    4326: 'megaeth'
  }
  const slug = mapping[chainId] || 'soneium'
  return `/explorer/${slug}/tx/${txHash}`
}

/** Block explorer transaction URL for supported chains. */
export function getTxExplorerUrl(chainId: number, txHash: string): string {
  if (chainId === 1868) {
    return `https://soneium.blockscout.com/tx/${txHash}`
  }
  if (chainId === 57073) {
    return `https://explorer.inkonchain.com/tx/${txHash}`
  }
  if (chainId === 8453) {
    return `https://basescan.org/tx/${txHash}`
  }
  if (chainId === 130) {
    return `https://uniscan.xyz/tx/${txHash}`
  }
  if (chainId === 4326) {
    return `https://megaeth.blockscout.com/tx/${txHash}`
  }
  return `https://soneium.blockscout.com/tx/${txHash}`
}
