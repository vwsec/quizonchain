import { createPublicClient, http } from 'viem';
import { soneiumMainnet } from './lib/chains';
import { quizScoresAbi } from './lib/submitScore';

const client = createPublicClient({ chain: soneiumMainnet, transport: http('https://rpc.soneium.org') });

async function run() {
  try {
    const res = await client.readContract({
      address: '0xFcd6909EFAC729DC901775895f3322f8050c7c73',
      abi: quizScoresAbi,
      functionName: 'getLeaderboard',
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
