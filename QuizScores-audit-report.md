# 🔐 Security Review — QuizScores

---

## Scope

|                                  |                                                        |
| -------------------------------- | ------------------------------------------------------ |
| **Mode**                         | Single file                                            |
| **Files reviewed**               | `contracts/QuizScores.sol`                             |
| **Confidence threshold (1-100)** | 75                                                     |

---

## Findings

[95] **1. Missing Signature Expiry / Deadline Enables Indefinite Replay**

`QuizScores._isValidSignature` · Confidence: 95

**Description**
The signed message includes player, score, total, nonce, chainid, and contract address — but no deadline/expiry field. A valid signature can be captured and submitted at any future time, even after the trusted signer rotates or the player's intended session expires.

**Fix**

```diff
  function _isValidSignature(
      address player,
      uint8 score,
      uint8 total,
      bytes calldata sig,
      uint256 nonce
  ) internal view returns (bool) {
      bytes32 digest = keccak256(
          abi.encode(
              player,
              score,
              total,
              nonce,
              block.chainid,
              address(this)
+             , block.timestamp  // or a deadline parameter passed in
          )
      ).toEthSignedMessageHash();
      return digest.recover(sig) == trustedSigner;
  }
```

**Additional Fix Required**: Add `deadline` parameter to `submitScore` and require `block.timestamp <= deadline` before signature verification.

---

[85] **2. Non-EIP-712 Compliant Signature Hash Weakens Wallet Compatibility & Auditability**

`QuizScores._isValidSignature` · Confidence: 85

**Description**
The contract uses a custom `keccak256(abi.encode(...)).toEthSignedMessageHash()` instead of EIP-712 `hashTypedDataV4`. This means:
- Standard wallets (MetaMask, Ledger, etc.) cannot natively sign this format without custom integration
- The hash structure lacks a domain separator typehash, making it harder to audit and verify
- Cross-contract/cross-chain protection relies on manual inclusion of `chainid` and `address(this)` rather than standardized domain separation

**Fix**

```diff
+    bytes32 constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
+    bytes32 constant SCORE_TYPEHASH = keccak256("SubmitScore(address player,uint8 score,uint8 total,uint256 nonce)");
+
+    function _domainSeparator() internal view returns (bytes32) {
+        return keccak256(abi.encode(
+            DOMAIN_TYPEHASH,
+            keccak256(bytes("QuizScores")),
+            keccak256(bytes("1")),
+            block.chainid,
+            address(this)
+        ));
+    }
+
    function _isValidSignature(
        address player,
        uint8 score,
        uint8 total,
        bytes calldata sig,
        uint256 nonce
    ) internal view returns (bool) {
-        bytes32 digest = keccak256(
-            abi.encode(
-                player,
-                score,
-                total,
-                nonce,
-                block.chainid,
-                address(this)
-            )
-        ).toEthSignedMessageHash();
+        bytes32 structHash = keccak256(abi.encode(SCORE_TYPEHASH, player, score, total, nonce));
+        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        return digest.recover(sig) == trustedSigner;
    }
```

**Note**: This change requires coordinated update with the off-chain signer (`/api/sign-score`). The comment at line 50-51 explicitly warns against adding DOMAIN_SEPARATOR without lockstep signer update.

---

[80] **3. Trusted Signer Single Point of Failure — Full Score Control**

`QuizScores.submitScore`, `QuizScores.setTrustedSigner` · Confidence: 80

**Description**
The `trustedSigner` address has unilateral authority to authorize any score for any player. If compromised:
- Attacker can submit perfect scores (5/5) for arbitrary addresses
- Drains leaderboard integrity, enables unauthorized NFT mints via QuizNFT
- 2-step transfer (propose/accept) prevents accidental change but not malicious compromise

**Fix**
No code fix eliminates this trust assumption. Recommended mitigations:
- Monitor trustedSigner address for anomalous activity off-chain
- Consider multi-sig (Gnosis Safe) as trustedSigner
- Implement score bounds validation on-chain (e.g., max score per session already enforced)
- Add emergency `pause()` — already present ✓

---

[75] **4. Owner Can Clear Any Player's Score Without Recourse**

`QuizScores.clearScore` · Confidence: 75

**Description**
`clearScore(address player)` (onlyOwner) deletes score, lastSubmissionAt, totalPoints, totalGames, but **does not** remove the player from the `players` array or reset `hasPlayed[player]`. This leaves inconsistent state:
- `players` array still contains the address
- `hasPlayed[player]` remains `true`
- `getLeaderboard()` will return 0 points for that player but they still appear in the list
- Nonce is NOT reset — player cannot resubmit with same nonce

**Fix**

```diff
    function clearScore(address player) external onlyOwner {
        delete scores[player];
        delete lastSubmissionAt[player];
+       delete nonces[player];
        delete totalPoints[player];
        delete totalGames[player];
+       hasPlayed[player] = false;
+       // Note: players array not compacted — gas cost. Consider lazy cleanup or accept gap.
        emit ScoreCleared(player);
    }
```

---

[75] **5. Cooldown Bypass via Trusted Signer Rotation Race**

`QuizScores.setTrustedSigner`, `QuizScores.acceptTrustedSigner`, `QuizScores.submitScore` · Confidence: 75

**Description**
The 2-step trusted signer transfer creates a window where:
1. Owner proposes new signer (attacker-controlled)
2. Attacker accepts → becomes trustedSigner
3. Attacker submits scores for any player **bypassing cooldown** (new signer, fresh nonces)
4. Original signer's signatures now invalid

While the 2-step prevents *accidental* transfer, it doesn't prevent a *malicious* owner or compromised owner key from installing a rogue signer who then bypasses all cooldowns.

**Fix**
Add cooldown on trusted signer change:
```diff
+    uint256 public constant SIGNER_CHANGE_COOLDOWN = 7 days;
+    uint256 public lastSignerChangeAt;
+
    function setTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Signer cannot be zero");
+       require(block.timestamp >= lastSignerChangeAt + SIGNER_CHANGE_COOLDOWN, "Signer change cooldown");
        pendingTrustedSigner = newSigner;
        emit TrustedSignerTransferStarted(trustedSigner, newSigner);
    }
+
+    function acceptTrustedSigner() external {
+        require(msg.sender == pendingTrustedSigner, "Not pending signer");
+        address previousSigner = trustedSigner;
+        trustedSigner = pendingTrustedSigner;
+        pendingTrustedSigner = address(0);
+        lastSignerChangeAt = block.timestamp;
+        emit TrustedSignerUpdated(previousSigner, trustedSigner);
+    }
```

---

[75] **6. `players` Array Grows Unbounded — DoS Risk on Leaderboard Reads**

`QuizScores.getLeaderboard`, `QuizScores.submitScore` · Confidence: 75

**Description**
`players` array pushes every unique player forever. `getLeaderboard()` iterates the entire array (O(n)) and returns all data. As player count grows:
- `getLeaderboard()` gas cost increases linearly → may exceed block gas limit
- `getLeaderboardPage()` mitigates but `getLeaderboard()` remains callable
- No mechanism to prune or archive old players

**Fix**
```diff
    function getLeaderboard() external view returns (
        address[] memory addrs,
        uint256[] memory points,
        uint256[] memory games
    ) {
-       uint256 len = players.length;
-       addrs = new address[](len);
-       points = new uint256[](len);
-       games = new uint256[](len);
-       for (uint256 i = 0; i < len; i++) {
-           addrs[i] = players[i];
-           points[i] = totalPoints[players[i]];
-           games[i] = totalGames[players[i]];
-       }
+       // Deprecated — use getLeaderboardPage
+       revert("Use getLeaderboardPage");
    }
```

---

## Leads

- **Cross-Chain Replay on Fork** — `QuizScores._isValidSignature` — Code smells: uses `block.chainid` at verification time — If chain forks (e.g., Ethereum PoW), signatures valid on both chains. Consider domain separator recalculation on fork detection.
- **Centralized Owner Power** — `QuizScores.setMaxTotal`, `QuizScores.setCooldownPeriod`, `QuizScores.clearScore` — Code smells: owner can change game parameters retroactively — Owner can reduce `maxTotal` below existing scores (no validation), set cooldown to 24h locking players, clear any score. Consider parameter constraints or timelock.
- **Nonce Not Reset on clearScore** — `QuizScores.clearScore` — Code smells: nonce persists after score cleared — Player cannot resubmit after clearScore without waiting for nonce to be valid (nonce already used). Fix included in Finding #4.

---

> ⚠️ This review was performed by an AI assistant. AI analysis can never verify the complete absence of vulnerabilities and no guarantee of security is given. Team security reviews, bug bounty programs, and on-chain monitoring are strongly recommended.