import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";

function freshProvider() {
  return new ethers.BrowserProvider(hre.network.provider as any);
}

async function send(provider: ethers.BrowserProvider, signer: ethers.Wallet, txFn: (nonce: number) => Promise<ethers.ContractTransactionResponse>) {
  const nonce = await provider.getTransactionCount(signer.address, "latest");
  const tx = await txFn(nonce);
  await provider.send("evm_mine", []);
  return tx.wait();
}

async function deployQuizNFT(deployerPk: string) {
  const provider = freshProvider();
  // Fund every throwaway key used by the suite on the in-process network.
  for (const k of KEYS) {
    await setBalance(new ethers.Wallet(k).address, 1000n ** 18n); // 1000 ETH
  }
  const deployer = new ethers.Wallet(deployerPk, provider);
  const artifact = await hre.artifacts.readArtifact("QuizNFT");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const c = (await factory.deploy("0x1563915e194D8CfBA1943570603F7606A3115508", "https://example.com/", 100)) as ethers.Contract;
  await provider.send("evm_mine", []);
  await c.waitForDeployment();
  return { c, provider, deployer };
}

const KEYS = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222222222222222222222222222",
];

describe("QuizNFT", function () {
  it("setMaxSupply rejects below minted and above cap", async function () {
    const { c, provider, deployer } = await deployQuizNFT(KEYS[0]);
    await expect(c.setMaxSupply(0)).to.be.revertedWith("Max supply must be > 0");
    await expect(c.setMaxSupply(100001)).to.be.revertedWith("maxSupply exceeds 100000");
  });

  it("owner can raise maxSupply within cap", async function () {
    const { c, provider, deployer } = await deployQuizNFT(KEYS[1]);
    await send(provider, deployer, (n) => c.setMaxSupply(50000, { nonce: n }));
    expect(await c.maxSupply()).to.equal(50000n);
  });
});
