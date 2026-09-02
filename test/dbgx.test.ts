import hre from "hardhat";
import { ethers } from "ethers";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";

const KEYS = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222222222222222222222222222",
];

it("dbg via send()", async function () {
  const provider = new ethers.BrowserProvider(hre.network.provider as any);
  for (const k of KEYS) await setBalance(new ethers.Wallet(k).address, 10n**18n);
  const deployer = new ethers.Wallet(KEYS[0], provider);
  const art = await hre.artifacts.readArtifact("QuizScores");
  const f = new ethers.ContractFactory(art.abi, art.bytecode, deployer);
  const c = await f.deploy(new ethers.Wallet(KEYS[1]).address);
  await c.waitForDeployment();
  const newSigner = new ethers.Wallet(KEYS[1], provider);
  const send = async (signer: any, txFn: any) => {
    const nonce = await provider.getTransactionCount(signer.address, "latest");
    const tx = await txFn(nonce);
    await provider.send("evm_mine", []);
    return tx.wait();
  };
  await send(deployer, (n: number) => c.setTrustedSigner(newSigner.address, { nonce: n }));
  console.log("pending:", await c.pendingTrustedSigner());
  await send(newSigner, (n: number) => c.connect(newSigner).acceptTrustedSigner({ nonce: n }));
  console.log("trusted:", await c.trustedSigner());
});
