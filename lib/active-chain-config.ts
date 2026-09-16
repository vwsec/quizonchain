const CHAIN_CONFIGS = {
  ink: {
    name: 'Ink',
    chainId: 57073,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#8b5cf6',
    rpc: 'https://rpc-gel.inkonchain.com',
    explorer: 'https://explorer.inkonchain.com',
    blockscoutApi: 'https://explorer.inkonchain.com/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_INK!,
    docsPages: [
      'https://docs.inkonchain.com/general/about',
      'https://docs.inkonchain.com/general/network-information',
      'https://docs.inkonchain.com/build/getting-started',
      'https://docs.inkonchain.com/build/transaction-fees',
      'https://docs.inkonchain.com/tools/bridges',
      'https://docs.inkonchain.com/tools/faucets',
      'https://docs.inkonchain.com/faq',
    ],
    heroTitle: 'The Knowledge of Ink',
    heroSubtitle: 'Test your Ink Onchain knowledge',
    heroLabel: 'INK',
    nftMetadataPath: '/nft/ink/1.json',
    nftImage: '/nft/ink.png',
  },
  soneium: {
    name: 'Soneium',
    chainId: 1868,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#45DCE8',
    rpc: 'https://rpc.soneium.org',
    explorer: 'https://soneium.blockscout.com',
    blockscoutApi: 'https://soneium.blockscout.com/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SONEIUM!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_SONEIUM!,
    docsPages: [
      'https://docs.soneium.org/docs/builders/overview',
      'https://docs.soneium.org/docs/builders/bridging',
      'https://docs.soneium.org/docs/builders/contracts',
      'https://docs.soneium.org/docs/builders/fees',
      'https://docs.soneium.org/docs/builders/faq',
      'https://docs.soneium.org/docs/users/faq',
      'https://docs.soneium.org/docs/',
    ],
    heroTitle: 'The Knowledge of Soneium',
    heroSubtitle: 'Test your Soneium blockchain knowledge',
    heroLabel: 'SONEIUM',
    nftMetadataPath: '/nft/soneium/1.json',
    nftImage: '/nft/soneium.png',
  },
  base: {
    name: 'Base',
    chainId: 8453,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#0000ff',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    blockscoutApi: 'https://base.blockscout.com/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_BASE!,
    docsPages: [
      'https://docs.base.org/base-chain/quickstart/why-base',
      'https://docs.base.org/base-account/overview/what-is-base-account',
      'https://docs.base.org/base-chain/network-information/bridges',
      'https://docs.base.org/base-chain/network-information/network-faucets',
      'https://docs.base.org/get-started/block-explorers',
    ],
    heroTitle: 'The Knowledge of Base',
    heroSubtitle: 'Test your Base blockchain knowledge',
    heroLabel: 'BASE',
    nftMetadataPath: '/nft/base/1.json',
    nftImage: '/nft/base.png',
  },
  unichain: {
    name: 'Unichain',
    chainId: 130,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#ff007a',
    rpc: 'https://mainnet.unichain.org',
    explorer: 'https://uniscan.xyz',
    blockscoutApi: 'https://unichain.blockscout.com/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN!,
    docsPages: [
      'https://docs.unichain.org/docs/unichain',
      'https://docs.unichain.org/docs/unichain/technical-information/network-information',
      'https://docs.unichain.org/docs/unichain/getting-started/setting-up-a-wallet',
      'https://docs.unichain.org/docs/unichain/guides/deploy-a-smart-contract',
      'https://docs.unichain.org/docs/building-on-unichain',
    ],
    heroTitle: 'The Knowledge of Unichain',
    heroSubtitle: 'Test your Unichain knowledge',
    heroLabel: 'UNICHAIN',
    nftMetadataPath: '/nft/unichain/1.json',
    nftImage: '/nft/unichain.png',
  },
  megaeth: {
    name: 'MegaETH',
    chainId: 4326,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#00ff88',
    rpc: 'https://mainnet.megaeth.com/rpc',
    explorer: 'https://megaeth.blockscout.com',
    blockscoutApi: 'https://megaeth.blockscout.com/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_MEGAETH!,
    docsPages: [
      'https://docs.megaeth.com',
      'https://docs.megaeth.com/spec',
      'https://docs.megaeth.com/architecture',
    ],
    heroTitle: 'The Knowledge of MegaETH',
    heroSubtitle: 'Test your MegaETH blockchain knowledge',
    heroLabel: 'MEGAETH',
    nftMetadataPath: '/nft/megaeth/1.json',
    nftImage: '/nft/megaeth.png',
  },
  litvm: {
    name: 'LitVM',
    chainId: 4441,
    nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
    color: '#00F2FE',
    rpc: 'https://liteforge.rpc.caldera.xyz/http',
    explorer: 'https://liteforge.explorer.caldera.xyz',
    blockscoutApi: 'https://liteforge.explorer.caldera.xyz/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_LITVM!,
    docsPages: [
      'https://docs.litvm.com/overview/about',
      'https://docs.litvm.com/overview/architecture',
      'https://docs.litvm.com/get-started-on-testnet/add-to-wallet',
      'https://docs.litvm.com/other-resources/faq',
    ],
    heroTitle: "The Knowledge of litvm",
    heroSubtitle: "Test your litvm blockchain knowledge",
    heroLabel: 'LITEFORGE',
    nftMetadataPath: '/nft/litvm/1.json',
    nftImage: '/nft/litvm.png',
  },
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#cbaeff',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://eth-sepolia.blockscout.com',
    blockscoutApi: 'https://eth-sepolia.blockscout.com/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA ?? '',
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_SEPOLIA ?? '',
    docsPages: [
      'https://ethereum.org/developers/docs/networks/',
      'https://ethereum.org/developers/docs/smart-contracts/',
      'https://ethereum.org/developers/docs/transactions/',
      'https://ethereum.org/developers/docs/gas/',
      'https://ethereum.org/developers/docs/accounts/',
      'https://ethereum.org/developers/docs/dapps/',
      'https://ethereum.org/developers/docs/consensus-mechanisms/',
      'https://ethereum.org/developers/docs/consensus-mechanisms/pos/',
    ],
    heroTitle: 'Quiz on Sepolia',
    heroSubtitle: 'Test your Ethereum knowledge on the Sepolia testnet',
    heroLabel: 'Sepolia Testnet',
    nftMetadataPath: '/nft/sepolia/1.json',
    nftImage: '/nft/sepolia.png',
  },
  arc: {
    name: 'Arc Testnet',
    chainId: 5042002,
    nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    whaleThreshold: 10000,
    color: '#4D8EE9',
    rpc: 'https://rpc.testnet.arc.network',
    explorer: 'https://testnet.arcscan.app',
    blockscoutApi: 'https://testnet.arcscan.app/api/v2',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC ?? undefined,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_ARC ?? "",
    docsPages: [
      'https://docs.arc.io/arc-chain',
      'https://docs.arc.io/arc/concepts/system-overview',
      'https://docs.arc.io/arc/references/gas-and-fees',
      'https://docs.arc.io/arc/references/connect-to-arc',
      'https://docs.arc.io/arc/tutorials/deploy-contracts',
    ],
    heroTitle: "The Knowledge of Arc",
    heroSubtitle: "Test your Arc blockchain knowledge",
    heroLabel: 'ARC',
    nftMetadataPath: '/nft/arc/1.json',
    nftImage: '/nft/arc.png',
  },
  arcMainnet: {
    name: 'Arc',
    chainId: 5042,
    nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    color: '#4D8EE9',
    rpc: 'https://rpc.mainnet.arc.io',
    explorer: 'https://explorer.arc.io',
    blockscoutApi: 'https://explorer.arc.io/api',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC_MAINNET!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_ARC_MAINNET!,
    docsPages: [
      'https://docs.arc.io/arc-chain',
      'https://docs.arc.io/arc/concepts/system-overview',
      'https://docs.arc.io/arc/references/gas-and-fees',
      'https://docs.arc.io/arc/references/connect-to-arc',
      'https://docs.arc.io/arc/tutorials/deploy-contracts',
    ],
    heroTitle: "The Knowledge of Arc",
    heroSubtitle: "Test your Arc blockchain knowledge",
    heroLabel: 'ARC',
    nftMetadataPath: '/nft/arc-mainnet/1.json',
    nftImage: '/nft/arc.png',
  },
  abstract: {
    name: 'Abstract',
    chainId: 2741,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: '#00b30f',
    rpc: 'https://api.mainnet.abs.xyz',
    explorer: 'https://abscan.org',
    blockscoutApi: '',
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ABSTRACT!,
    nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_ABSTRACT!,
    docsPages: [
      'https://docs.abs.xyz/connect-to-abstract',
      'https://docs.abs.xyz',
    ],
    heroTitle: 'The Knowledge of Abstract',
    heroSubtitle: 'Test your Abstract blockchain knowledge',
    heroLabel: 'ABSTRACT',
    nftMetadataPath: '/nft/abstract/1.json',
    nftImage: '/nft/abstract.png',
  },
} as const;

type ChainKey = keyof typeof CHAIN_CONFIGS;

const CHAIN_ID_TO_KEY: Record<number, ChainKey> = {
  57073: 'ink',
  1868: 'soneium',
  8453: 'base',
  130: 'unichain',
  4326: 'megaeth',
  4441: 'litvm',
  5042002: 'arc',
  5042: 'arcMainnet',
  11155111: 'sepolia',
  2741: 'abstract',
};

export function getChainConfig(chainId: number) {
  const key = CHAIN_ID_TO_KEY[chainId];
  return key ? CHAIN_CONFIGS[key] : undefined;
}

export function getThemeName(config: { name: string } | undefined): string {
  if (!config) return '';
  const name = config.name;
  if (name === 'MegaETH') return 'megaeth';
  if (name === 'Ink') return 'ink';
  if (name === 'Unichain') return 'unichain';
  if (name === 'Base') return 'base';
  if (name === 'Soneium') return 'soneium';
  if (name === 'Sepolia') return 'sepolia';
  if (name === 'LitVM') return 'litvm';
  if (name === 'Arc Testnet' || name === 'Arc') return 'arc';
  if (name === 'Abstract') return 'abstract';
  return '';
}

export function getThemeClass(config: { name: string } | undefined): string {
  const theme = getThemeName(config);
  return theme ? `theme-${theme}` : '';
}

export const activeChainKey = (process.env.NEXT_PUBLIC_ACTIVE_CHAIN ?? '') as string;

function getEnvChainConfig() {
  if (activeChainKey && activeChainKey in CHAIN_CONFIGS) {
    return CHAIN_CONFIGS[activeChainKey as ChainKey];
  }
  return undefined;
}

export const activeChainConfig = getEnvChainConfig() ?? CHAIN_CONFIGS.ink;

