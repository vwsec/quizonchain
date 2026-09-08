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
  blockExplorers: { default: { name: 'MegaETH Explorer', url: 'https://www.megaexplorer.xyz' } },
  iconUrl: '/chains/megaeth.png',
});

export const litvmTestnet = defineChain({
  id: 4441,
  name: 'LitVM LiteForge',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
  blockExplorers: { default: { name: 'LitVM Explorer', url: 'https://liteforge.explorer.caldera.xyz' } },
  iconUrl: '/chains/litvm.png',
  testnet: true,
});

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'], webSocket: ['wss://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  iconUrl: '/chains/arc.png',
  testnet: true,
});

export const sepoliaTestnet = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://rpc.sepolia.org',
      ],
    },
  },
  blockExplorers: { default: { name: 'Blockscout', url: 'https://eth-sepolia.blockscout.com' } },
  testnet: true,
});

export const soneiumChains = [
  inkMainnet,
  soneiumMainnet,
  base,
  unichain,
  megaEth,
  litvmTestnet,
  arcTestnet,
  sepoliaTestnet,
] as const

export function getSoneiumChainById(chainId: number) {
  return soneiumChains.find((c) => c.id === chainId)
}

/** Internal explorer transaction URL for deep-linking. */
export function getTxInternalUrl(chainId: number, txHash: string): string {
  return getTxExplorerUrl(chainId, txHash)
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
  if (chainId === 4441) {
    return `https://liteforge.explorer.caldera.xyz/tx/${txHash}`
  }
  if (chainId === 5042002) {
    return `https://testnet.arcscan.app/tx/${txHash}`
  }
  if (chainId === 11155111) {
    return `https://eth-sepolia.blockscout.com/tx/${txHash}`
  }
  return `https://soneium.blockscout.com/tx/${txHash}`
}
