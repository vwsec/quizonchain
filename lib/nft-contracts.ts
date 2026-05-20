export const NFT_CONTRACTS: Record<number, string> = {
  57073: process.env.NEXT_PUBLIC_NFT_CONTRACT_INK!,
  1868: process.env.NEXT_PUBLIC_NFT_CONTRACT_SONEIUM!,
  8453: process.env.NEXT_PUBLIC_NFT_CONTRACT_BASE!,
  130: process.env.NEXT_PUBLIC_NFT_CONTRACT_UNICHAIN!,
  4326: process.env.NEXT_PUBLIC_NFT_CONTRACT_MEGAETH ?? "",
  4441: process.env.NEXT_PUBLIC_NFT_CONTRACT_LITVM!,
  5042002: process.env.NEXT_PUBLIC_NFT_CONTRACT_ARC ?? "",
};

export const NFT_ABI = [
  { name: 'mint', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'canMint', type: 'function', stateMutability: 'view', inputs: [{ name: 'player', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'hasMinted', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'totalMinted', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;
