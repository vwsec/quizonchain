import { createPublicClient, http, type Chain } from 'viem';
import { quizScoresAbi } from './submitScore';
import { type GlobalPlayer } from './leaderboard';

export async function getChainLeaderboard(chainConfig: {
  chain: Chain;
  contractAddress: string;
  chainName: string;
}): Promise<GlobalPlayer[]> {
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
