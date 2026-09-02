import { createPublicClient, http, type Chain } from 'viem';
import { quizScoresAbi } from './submitScore';
import { inkMainnet, soneiumMainnet, base, unichain, megaEth, litvmTestnet, arcTestnet, sepoliaTestnet } from './chains';
import { fetchLitvmLeaderboard } from './litvm-leaderboard';

export type GlobalPlayer = {
  address: `0x${string}`;
  points: number;
  games: number;
  chains: string[];
  avg: number;
  rank?: number;
};

const ALL_CHAINS: { chain: Chain; contractAddress: string; chainName: string }[] = [
  { chain: inkMainnet,      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET!,    chainName: "Ink" },
  { chain: soneiumMainnet,  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET!,        chainName: "Soneium" },
  { chain: base,            contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET!,   chainName: "Base" },
  { chain: unichain,        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN!,       chainName: "Unichain" },
  { chain: megaEth,         contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MEGAETH!,        chainName: "MegaETH" },
  { chain: litvmTestnet,    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LITVM!,          chainName: "LitVM" },
  { chain: arcTestnet,      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ARC!,            chainName: "Arc Testnet" },
  { chain: sepoliaTestnet,  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA!,        chainName: "Sepolia" },
].filter(c => c.contractAddress);

export async function getChainLeaderboard(chainConfig: {
  chain: Chain;
  contractAddress: string;
  chainName: string;
}): Promise<GlobalPlayer[]> {
  // LitVM uses the hybrid seed+events loader instead of direct RPC
  if (chainConfig.chain.id === 4441) {
    try {
      return await fetchLitvmLeaderboard()
    } catch {
      // fall through to the direct RPC path if hybrid loader fails
    }
  }

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(undefined, {
      retryCount: 5,
      retryDelay: 1000,
    })
  });

  const readWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
    try {
      return await client.readContract({
        address: chainConfig.contractAddress as `0x${string}`,
        abi: quizScoresAbi,
        functionName: 'getLeaderboard',
      });
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return readWithRetry(retries - 1, delay * 2);
    }
  }

  const [addrs, points, games] = await readWithRetry() as [`0x${string}`[], bigint[], bigint[]];

  return addrs.map((address, i) => ({
    address,
    points: Number(points[i]),
    games: Number(games[i]),
    chains: [chainConfig.chainName],
    avg: Number(games[i]) > 0 ? (Number(points[i]) / (Number(games[i]) * 5)) * 100 : 0
  })).sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));
}

export async function fetchGlobalLeaderboard(): Promise<{ players: GlobalPlayer[]; failedChains: string[] }> {
  const results = await Promise.allSettled(
    ALL_CHAINS.map(config =>
      getChainLeaderboard(config).then(players => ({ chainName: config.chainName, players }))
    )
  );

  const merged = new Map<string, { points: number; games: number; chains: string[] }>();
  const failedChains: string[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const { chainName, players } = result.value;
      players.forEach(p => {
        const key = p.address.toLowerCase();
        const existing = merged.get(key);
        if (existing) {
          existing.points += p.points;
          existing.games += p.games;
          if (!existing.chains.includes(chainName)) {
            existing.chains.push(chainName);
          }
        } else {
          merged.set(key, {
            points: p.points,
            games: p.games,
            chains: [chainName],
          });
        }
      });
    } else {
      const chainName = ALL_CHAINS[i]?.chainName ?? 'Unknown';
      const errMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      let cleanMsg = errMsg.split('\n')[0];
      if (cleanMsg.includes('RPC Request failed')) cleanMsg = 'Service Busy';
      failedChains.push(`${chainName} (${cleanMsg})`);
      console.error(`Failed to fetch leaderboard from ${chainName}:`, result.reason);
    }
  });

  const players: GlobalPlayer[] = Array.from(merged.entries())
    .map(([address, data]) => ({
      address: address as `0x${string}`,
      ...data,
      avg: data.games > 0 ? (data.points / (data.games * 5)) * 100 : 0
    }))
    .sort((a, b) => b.points - a.points)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  return { players, failedChains };
}
