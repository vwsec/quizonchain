# Production Readiness Checklist for QuizonChain

## Smart Contract Fixes (from security-patches.patch)

### Critical - Apply Before Deploy
- [ ] **Add `Pausable` to both contracts** — emergency stop capability
- [ ] **Fix domain separator in `QuizScores._isValidSignature`** — prevents cross-chain replay attacks
- [ ] **Fix `QuizNFT._hasReachedThreshold` staticcall decode bug** — properly handles `0` return values
- [ ] **Add 2-step ownership transfer for `quizScoresContract`** — prevents accidental/malicious pointing
- [ ] **Add `maxSupply` cap to QuizNFT** — prevents unlimited minting

### High Priority
- [ ] **Remove hardcoded cooldown limits (5min–24hr)** — allow owner to set 0 or custom values
- [ ] **Add minimum `pointsThreshold` validation** — prevent trivial thresholds
- [ ] **Add `supportsInterface` override** — ERC721 compliance
- [ ] **Pin Solidity version to `0.8.27`** (matches hardhat config) — avoid compiler drift

---

## Missing Test Coverage (Critical Gap)

**Currently: 0 tests found for smart contracts**

### Required Test Suites
```bash
# Create test files:
test/QuizScores.test.ts
test/QuizNFT.test.ts
```

### Minimum Test Cases

| Contract | Test Cases |
|----------|------------|
| **QuizScores** | ✅ Valid signature submits score<br>✅ Invalid signature rejects<br>✅ Replay attack (same sig twice) fails<br>✅ Cross-chain replay fails (domain separator)<br>✅ Cooldown enforcement<br>✅ Owner pause/unpause blocks/allows<br>✅ Score cleared by owner<br>✅ Leaderboard returns correct data<br>✅ Nonce increments on submit<br>✅ Cooldown period update bounds |
| **QuizNFT** | ✅ Mint succeeds when threshold met<br>✅ Mint fails when threshold not met<br>✅ Double mint fails<br>✅ Pause blocks mint<br>✅ `staticcall` handles 0 return correctly<br>✅ 2-step contract update works<br>✅ Max supply cap enforced<br>✅ Owner can update baseURI/threshold<br>✅ `canMint` view matches actual state |

### Run Tests
```bash
npm run compile
npx hardhat test
npx hardhat coverage  # target: 95%+ line coverage
```

---

## Deployment & Operations

### Pre-Deploy
- [ ] **Verify contracts on explorers** (Basescan, Soneium Explorer, etc.) — use `hardhat verify`
- [ ] **Set trusted signer to multisig (Gnosis Safe)** — not a single EOA
- [ ] **Configure cooldown period** appropriate for your quiz frequency
- [ ] **Set reasonable `pointsThreshold` and `maxSupply`**
- [ ] **Fund deployer wallet** for gas on all target chains

### Post-Deploy
- [ ] **Verify `QuizNFT.quizScoresContract` points to correct `QuizScores` address**
- [ ] **Test end-to-end: submit score → verify points → mint NFT**
- [ ] **Monitor first 24h for anomalies** (failed txs, unusual patterns)

---

## Frontend / Backend Integration

### API Route: `/api/sign-score`
- [ ] **Rate limit** — prevent signature farming
- [ ] **Validate quiz token / answers** server-side before signing
- [ ] **Log all signing requests** (player, score, timestamp) for audit
- [ ] **Use dedicated signing key** (not deployer key) — store in HSM/KMS/Vault

### Environment Variables (per chain)
```bash
# QuizScores
NEXT_PUBLIC_CONTRACT_ADDRESS_<CHAIN>=0x...

# QuizNFT  
NEXT_PUBLIC_NFT_CONTRACT_<CHAIN>=0x...

# Backend only (never expose to frontend)
QUIZ_SIGNER_PRIVATE_KEY=0x...
```

---

## Monitoring & Alerting

- [ ] **Track `ScoreSubmitted` events** — alert on volume spikes/drops
- [ ] **Track `NFTMinted` events** — alert if minting stops unexpectedly
- [ ] **Monitor `Paused`/`Unpaused` events** — immediate alert
- [ ] **Watch for failed `submitScore` txs** — could indicate frontend bug or attack
- [ ] **Dashboard**: leaderboard freshness, mint rate, error rates

---

## Upgradeability (Future-Proofing)

Current contracts are **not upgradeable**. For production:

| Option | Effort | Notes |
|--------|--------|-------|
| **OpenZeppelin Upgrades (UUPS)** | Medium | Add `ERC1967Upgrade`, `UUPSUpgradeable`; deploy via proxy |
| **Diamond Pattern (EIP-2535)** | High | Modular, but complex |
| **Accept immutable + redeploy** | Low | Simple; migrate state via `clearScore` + re-submit (not ideal) |

**Recommendation**: Start with immutable. Plan UUPS upgrade path for v2.

---

## Security Audit

- [ ] **Internal review** — this checklist + code review by 2+ engineers
- [ ] **Automated tools**: Slither, Mythril, Foundry fuzzing
- [ ] **External audit** — if TVL > $100k or high-profile, budget for professional audit (Spearbit, Cantina, etc.)

---

## Quick Commands Reference

```bash
# Compile
npm run compile

# Test
npx hardhat test

# Coverage
npx hardhat coverage

# Deploy (example: Sepolia)
npm run deploy:sepolia

# Deploy NFT (example: Sepolia)
npx hardhat run scripts/deploy-nft.ts --network sepoliaTestnet

# Verify (example: Sepolia)
npx hardhat verify --network sepoliaTestnet <QUIZSCORES_ADDRESS> <TRUSTED_SIGNER>
npx hardhat verify --network sepoliaTestnet <NFT_ADDRESS> <QUIZSCORES_ADDRESS> <BASE_URI> 100
```

---

## Files Created

| File | Purpose |
|------|---------|
| `security-patches.patch` | Unified diff with all critical/high fixes |
| `PRODUCTION_CHECKLIST.md` | This file |

---

**Next Steps:**
1. Review `security-patches.patch` — apply manually or via `git apply`
2. Write tests in `test/` directory
3. Run full test suite + coverage
4. Deploy to testnet, verify, test end-to-end
5. Configure monitoring
6. Plan mainnet deploy with multisig signer