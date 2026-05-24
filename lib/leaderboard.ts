import { createPublicClient, http } from 'viem';
import { soneiumMainnet, inkMainnet, base, unichain, sepoliaTestnet } from './chains';
import { quizScoresAbi } from './submitScore';

export type GlobalPlayer = {
  address: `0x${string}`;
  points: number;
  games: number;
  chains: string[];
  avg: number;
  rank?: number;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export async function fetchGlobalLeaderboard() {
  const CONTRACTS = [
    { chain: inkMainnet, address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_INK_MAINNET },
    { chain: soneiumMainnet, address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET },
    { chain: base, address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_MAINNET },
    { chain: unichain, address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNICHAIN },
    { chain: sepoliaTestnet, address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA },
  ].filter(c => c.address);

  // Fetch all chains in parallel using Promise.allSettled to gracefully handle errors
  const results = await Promise.allSettled(
    CONTRACTS.map(({ chain, address }) => {
      const client = createPublicClient({ 
        chain, 
        transport: http(undefined, {
          retryCount: 5,
          retryDelay: 1000,
          timeout: 15000,
        }) 
      });

      return withRetry(() => client.readContract({
        address: address as `0x${string}`,
        abi: quizScoresAbi,
        functionName: 'getLeaderboard',
      })).then((res) => ({ chainName: chain.name, res }));
    })
  );

  const merged = new Map<string, { points: number; games: number; chains: string[] }>();
  const failedChains: string[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const { chainName, res } = result.value;
      const [addrs, points, games] = res as [`0x${string}`[], bigint[], bigint[]];
      
      addrs.forEach((addr, j) => {
        const key = addr.toLowerCase();
        const existing = merged.get(key);
        if (existing) {
          existing.points += Number(points[j]);
          existing.games += Number(games[j]);
          if (!existing.chains.includes(chainName)) {
            existing.chains.push(chainName);
          }
        } else {
          merged.set(key, {
            points: Number(points[j]),
            games: Number(games[j]),
            chains: [chainName],
          });
        }
      });
    } else {
      const errMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      // Clean up common RPC error messages for user readability
      let cleanMsg = errMsg.split('\n')[0];
      if (cleanMsg.includes('RPC Request failed')) cleanMsg = 'Service Busy';
      
      failedChains.push(`${CONTRACTS[i].chain.name} (${cleanMsg})`);
      console.error(`Failed to fetch leaderboard from ${CONTRACTS[i].chain.name}:`, result.reason);
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
