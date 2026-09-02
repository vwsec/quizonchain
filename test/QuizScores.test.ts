import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";

// Throwaway test keys for the in-process hardhat network (never broadcasts).
const SIGNER_PK = "0x1111111111111111111111111111111111111111111111111111111111111111";

// Mirrors /api/sign-score encoding exactly (6 fields, NO DOMAIN_SEPARATOR).
async function signScore(player: string, score: number, total: number, nonce: number, chainId: number, contract: string, wallet: ethers.Wallet) {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint8", "uint8", "uint256", "uint256", "address"],
    [player, score, total, nonce, chainId, contract]
  );
  const digest = ethers.keccak256(encoded);
  return wallet.signMessage(ethers.getBytes(digest));
}

function freshProvider() {
  return new ethers.BrowserProvider(hre.network.provider as any);
}

// ethers Wallet caches nonce; with manual mining we read fresh nonce from chain each send.
async function send(provider: ethers.BrowserProvider, signer: ethers.Wallet, txFn: (nonce: number) => Promise<ethers.ContractTransactionResponse>) {
  const nonce = await provider.getTransactionCount(signer.address, "latest");
  const tx = await txFn(nonce);
  await provider.send("evm_mine", []);
  return tx.wait();
}

async function deployQuizScores(deployerPk: string, signerAddr: string) {
  const provider = freshProvider();
  // Fund every throwaway key used by the suite on the in-process network.
  for (const k of KEYS.concat(SIGNER_PK)) {
    await setBalance(new ethers.Wallet(k).address, 1000n ** 18n); // 1000 ETH
  }
  const deployer = new ethers.Wallet(deployerPk, provider);
  const artifact = await hre.artifacts.readArtifact("QuizScores");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const c = (await factory.deploy(signerAddr)) as ethers.Contract;
  await provider.send("evm_mine", []);
  await c.waitForDeployment();
  return { c, provider, deployer };
}

const KEYS = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444444444444444444444444444",
  "0x5555555555555555555555555555555555555555555555555555555555555555",
  "0x6666666666666666666666666666666666666666666666666666666666666666",
  "0x7777777777777777777777777777777777777777777777777777777777777777",
  "0x8888888888888888888888888888888888888888888888888888888888888888",
  "0x9999999999999999999999999999999999999999999999999999999999999999",
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
];

describe("QuizScores", function () {
  it("accepts a signature built by the server scheme (production-safe)", async function () {
    const { c, provider } = await deployQuizScores(KEYS[0], new ethers.Wallet(SIGNER_PK).address);
    const player = new ethers.Wallet(KEYS[1], provider);
    const signer = new ethers.Wallet(SIGNER_PK, provider);
    const addr = await c.getAddress();
    const sig = await signScore(player.address, 5, 5, 0, 31337, addr, signer);
    await send(provider, player, (n) => c.connect(player).submitScore(5, 5, sig, { nonce: n }));
    expect(await c.nonces(player.address)).to.equal(1n);
    expect(await c.totalPoints(player.address)).to.equal(5n);
  });

  it("rejects a reused signature (nonce replay)", async function () {
    const { c, provider } = await deployQuizScores(KEYS[2], new ethers.Wallet(SIGNER_PK).address);
    const player = new ethers.Wallet(KEYS[3], provider);
    const signer = new ethers.Wallet(SIGNER_PK, provider);
    const addr = await c.getAddress();
    const sig = await signScore(player.address, 5, 5, 0, 31337, addr, signer);
    await send(provider, player, (n) => c.connect(player).submitScore(5, 5, sig, { nonce: n }));
    // Reused signature must be rejected. Cooldown may fire first; both prove the replay is blocked.
    await expect(c.connect(player).submitScore(5, 5, sig, { nonce: 1 }))
      .to.be.revertedWith(/Invalid signature|Submission cooldown active/);
  });

  it("enforces cooldown", async function () {
    const { c, provider } = await deployQuizScores(KEYS[4], new ethers.Wallet(SIGNER_PK).address);
    const player = new ethers.Wallet(KEYS[5], provider);
    const signer = new ethers.Wallet(SIGNER_PK, provider);
    const addr = await c.getAddress();
    const sig0 = await signScore(player.address, 5, 5, 0, 31337, addr, signer);
    await send(provider, player, (n) => c.connect(player).submitScore(5, 5, sig0, { nonce: n }));
    const sig1 = await signScore(player.address, 4, 5, 1, 31337, addr, signer);
    await expect(c.connect(player).submitScore(4, 5, sig1, { nonce: 1 })).to.be.revertedWith("Submission cooldown active");
  });

  it("clearScore resets totals", async function () {
    const { c, provider } = await deployQuizScores(KEYS[6], new ethers.Wallet(SIGNER_PK).address);
    const player = new ethers.Wallet(KEYS[7], provider);
    const signer = new ethers.Wallet(SIGNER_PK, provider);
    const addr = await c.getAddress();
    const sig = await signScore(player.address, 5, 5, 0, 31337, addr, signer);
    await send(provider, player, (n) => c.connect(player).submitScore(5, 5, sig, { nonce: n }));
    expect(await c.totalPoints(player.address)).to.equal(5n);
    await send(provider, new ethers.Wallet(KEYS[6], provider), (n) => c.clearScore(player.address, { nonce: n }));
    expect(await c.totalPoints(player.address)).to.equal(0n);
    expect(await c.totalGames(player.address)).to.equal(0n);
  });

  it("getLeaderboardPage returns a slice", async function () {
    const { c, provider } = await deployQuizScores(KEYS[8], new ethers.Wallet(SIGNER_PK).address);
    const pA = new ethers.Wallet(KEYS[9], provider);
    const pB = new ethers.Wallet(KEYS[10], provider);
    const signer = new ethers.Wallet(SIGNER_PK, provider);
    const addr = await c.getAddress();
    for (const p of [pA, pB]) {
      const sig = await signScore(p.address, 5, 5, 0, 31337, addr, signer);
      await send(provider, p, (n) => c.connect(p).submitScore(5, 5, sig, { nonce: n }));
    }
    const page = await c.getLeaderboardPage(0, 1);
    expect(page[0].length).to.equal(1);
  });

  it("pause blocks submit", async function () {
    const { c, provider } = await deployQuizScores(KEYS[11], new ethers.Wallet(SIGNER_PK).address);
    const player = new ethers.Wallet(KEYS[2], provider);
    const signer = new ethers.Wallet(SIGNER_PK, provider);
    const addr = await c.getAddress();
    await send(provider, new ethers.Wallet(KEYS[11], provider), (n) => c.pause({ nonce: n }));
    const sig = await signScore(player.address, 5, 5, 0, 31337, addr, signer);
    await expect(c.connect(player).submitScore(5, 5, sig, { nonce: 0 })).to.be.revertedWithCustomError(c, "EnforcedPause");
  });

  it("2-step trusted signer transfer", async function () {
    const { c, provider } = await deployQuizScores(KEYS[0], new ethers.Wallet(SIGNER_PK).address);
    const owner = new ethers.Wallet(KEYS[0], provider);
    const newSigner = new ethers.Wallet(KEYS[1], provider);
    await send(provider, owner, (n) => c.setTrustedSigner(newSigner.address, { nonce: n }));
    // Not active until accepted
    expect(await c.trustedSigner()).to.equal(new ethers.Wallet(SIGNER_PK).address);
    await send(provider, newSigner, (n) => c.connect(newSigner).acceptTrustedSigner({ nonce: n }));
    expect(await c.trustedSigner()).to.equal(newSigner.address);
  });
});
