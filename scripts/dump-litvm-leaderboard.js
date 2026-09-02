/**
 * scripts/dump-litvm-leaderboard.js
 *
 * ONE-TIME dump of the full LitVM leaderboard using Multicall3.
 * Reads 74K+ player addresses + scores in parallel batches,
 * sorts descending by points, and writes to data/leaderboard-litvm.json.
 *
 * Run: node scripts/dump-litvm-leaderboard.js
 */

const { createPublicClient, http, encodeFunctionData, decodeAbiParameters } = require('viem');
const fs = require('fs');
const path = require('path');

const RPC = 'https://liteforge.rpc.caldera.xyz/infra-partner-http';
const CONTRACT = '0xBEd500d8d59547269085BBB4fa32Fab4394a4802';
const MULTICALL = '0xcA11bde05977b3631167028862bE2a173976CA11';
const PLAYERS_SLOT = 6n;
const BATCH = 1000;          // reads per multicall
const PARALLEL = 6;          // concurrent multicalls
const SCORE_BATCH = 300;     // players per score multicall (smaller to avoid RPC timeouts)
const SCORE_PARALLEL = 4;    // concurrent score multicalls
const OUTPUT = path.join(__dirname, '..', 'public', 'data', 'leaderboard-litvm.json');

const client = createPublicClient({
  transport: http(RPC, { retryCount: 3, timeout: 60_000 }),
  chain: { id: 4441, name: 'LitVM' },
});

const mcAbi = [{
  inputs: [{ components: [{ name: 'target', type: 'address' }, { name: 'callData', type: 'bytes' }], name: 'calls', type: 'tuple[]' }],
  name: 'aggregate',
  outputs: [{ name: 'blockNumber', type: 'uint256' }, { name: 'returnData', type: 'bytes[]' }],
  stateMutability: 'payable', type: 'function',
}];

function encodePlayerCall(i) {
  const abi = [{ inputs: [{ name: '', type: 'uint256' }], name: 'players', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' }];
  return encodeFunctionData({ abi, functionName: 'players', args: [BigInt(i)] });
}

function encodePointsCall(addr) {
  const abi = [{ inputs: [{ name: '', type: 'address' }], name: 'totalPoints', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }];
  return encodeFunctionData({ abi, functionName: 'totalPoints', args: [addr] });
}

function encodeGamesCall(addr) {
  const abi = [{ inputs: [{ name: '', type: 'address' }], name: 'totalGames', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }];
  return encodeFunctionData({ abi, functionName: 'totalGames', args: [addr] });
}

async function multicallRead(calls) {
  const data = encodeFunctionData({ abi: mcAbi, functionName: 'aggregate', args: [calls] });
  const result = await client.call({ to: MULTICALL, data });
  const decoded = decodeAbiParameters([{ type: 'uint256' }, { type: 'bytes[]' }], result.data);
  return decoded[1];
}

function decodeAddress(returnData) {
  return decodeAbiParameters([{ type: 'address' }], returnData)[0];
}

function decodeUint256(returnData) {
  return Number(decodeAbiParameters([{ type: 'uint256' }], returnData)[0]);
}

async function main() {
  const t0 = Date.now();
  console.log('[dump] Starting LitVM leaderboard dump...');

  // 1. Read players.length
  const lenHex = await client.request({
    method: 'eth_getStorageAt',
    params: [CONTRACT, '0x' + PLAYERS_SLOT.toString(16).padStart(64, '0'), 'latest'],
  });
  const total = Number(BigInt(lenHex));
  console.log(`[dump] players.length: ${total}`);

  // 2. Read all player addresses via multicall
  const indices = Array.from({ length: total }, (_, i) => i);
  const chunks = [];
  for (let i = 0; i < indices.length; i += BATCH) chunks.push(indices.slice(i, i + BATCH));

  const addresses = [];
  for (let i = 0; i < chunks.length; i += PARALLEL) {
    const batch = chunks.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      batch.map(async (chunk) => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await multicallRead(chunk.map(idx => ({ target: CONTRACT, callData: encodePlayerCall(idx) })));
          } catch {
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          }
        }
        throw new Error(`Failed after 3 attempts for address chunk starting at idx ${chunk[0]}`);
      })
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        for (const rd of results[j].value) {
          try { addresses.push(decodeAddress(rd)); } catch { /* skip failed decode */ }
        }
      }
    }
    const pct = Math.min(100, Math.round((addresses.length / total) * 100));
    const elapsed = Math.round((Date.now() - t0) / 1000);
    console.log(`[dump] addresses: ${addresses.length}/${total} (${pct}%) — ${elapsed}s`);
  }

  console.log(`[dump] All ${addresses.length} addresses read. Reading scores...`);

  // 3. Read totalPoints + totalGames for all players (smaller batches, retries)
  const entries = [];
  const addrChunks = [];
  for (let i = 0; i < addresses.length; i += SCORE_BATCH) addrChunks.push(addresses.slice(i, i + SCORE_BATCH));

  for (let i = 0; i < addrChunks.length; i += SCORE_PARALLEL) {
    const batch = addrChunks.slice(i, i + SCORE_PARALLEL);
    const results = await Promise.allSettled(
      batch.map(async (chunk) => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const calls = [];
            for (const addr of chunk) {
              calls.push({ target: CONTRACT, callData: encodePointsCall(addr) });
              calls.push({ target: CONTRACT, callData: encodeGamesCall(addr) });
            }
            return await multicallRead(calls);
          } catch {
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          }
        }
        throw new Error(`Failed after 3 attempts for chunk starting at idx ${addresses.indexOf(chunk[0])}`);
      })
    );
    let added = 0;
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        const rds = results[j].value;
        for (let k = 0; k < rds.length; k += 2) {
          try {
            const points = decodeUint256(rds[k]);
            const games = decodeUint256(rds[k + 1]);
            const chunkIdx = i + j;
            const globalIdx = chunkIdx * SCORE_BATCH + Math.floor(k / 2);
            if (globalIdx < addresses.length) {
              entries.push({ address: addresses[globalIdx], points, games });
              added++;
            }
          } catch { /* skip corrupt entry */ }
        }
      } else {
        console.log(`[dump] score chunk ${i + j} FAILED: ${results[j].reason?.shortMessage || results[j].reason}`);
      }
    }
    const pct = Math.min(100, Math.round((entries.length / total) * 100));
    const elapsed = Math.round((Date.now() - t0) / 1000);
    console.log(`[dump] scores: ${entries.length}/${total} (${pct}%) — ${elapsed}s (+${added} this batch)`);
  }

  // 4. Sort by points descending, add computed fields
  const sorted = entries
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({
      address: e.address,
      points: e.points,
      games: e.games,
      avg: e.games > 0 ? Math.round((e.points / (e.games * 5)) * 100) : 0,
      rank: i + 1,
    }));

  // 5. Write
  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(sorted, null, 2));
  const totalTime = Math.round((Date.now() - t0) / 1000);

  console.log(`\n[dump] Done in ${totalTime}s`);
  console.log(`[dump] Top 3:`);
  sorted.slice(0, 3).forEach(e => console.log(`  #${e.rank}: ${e.address} — ${e.points} pts in ${e.games} games (${e.avg}%)`));
  console.log(`[dump] Written to ${OUTPUT} (${sorted.length} players)`);
}

main().catch(e => { console.error('[dump] Fatal:', e); process.exit(1); });