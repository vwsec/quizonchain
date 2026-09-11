# 🔐 Security Review — QuizNFT

---

## Scope

|                                  |                                                        |
| -------------------------------- | ------------------------------------------------------ |
| **Mode**                         | Single file                                            |
| **Files reviewed**               | `contracts/QuizNFT.sol`                                |
| **Confidence threshold (1-100)** | 75                                                     |

---

## Findings

[90] **1. QuizScores Trusted Signer Compromise = Unlimited NFT Minting**

`QuizNFT._hasReachedThreshold`, `QuizNFT.mint` · Confidence: 90

**Description**
`_hasReachedThreshold` trusts `QuizScores.totalPoints()` via staticcall. The QuizScores `trustedSigner` has unilateral authority to submit arbitrary scores. If trustedSigner is compromised:
- Attacker submits max scores for any address → `totalPoints >= pointsThreshold`
- Attacker mints NFTs for arbitrary addresses (bypassing `hasMinted` by using new addresses)
- Drains entire `maxSupply` (default 10,000, cap 100,000)
- 2-step QuizScores contract change mitigates but requires owner action

**Fix**
No code fix eliminates this cross-contract trust assumption. Recommended:
- Use multi-sig (Gnosis Safe) as QuizScores `trustedSigner`
- Monitor QuizScores for anomalous score submissions off-chain
- Consider adding a `maxMintsPerBlock` or rate limit in QuizNFT
- Emergency `pause()` in QuizNFT — already present ✓

---

[85] **2. Reentrancy via ERC721 `onERC721Received` Callback — State Updated Before Call (Mitigated)**

`QuizNFT.mint` · Confidence: 85

**Description**
`mint()` follows CEI pattern correctly:
1. Checks `!hasMinted[msg.sender]`
2. Checks threshold via staticcall
3. Checks `totalMinted < maxSupply`
4. **Updates state**: `hasMinted[msg.sender] = true; totalMinted++`
5. Calls `_safeMint()` → triggers `onERC721Received` on recipient

If recipient is a contract with malicious `onERC721Received`, it can re-enter `mint()`. However, `hasMinted[msg.sender]` is already `true`, so reentrant call reverts at first require. **Mitigated by correct CEI ordering.**

**Verification**: State updates (lines 45-47) occur before `_safeMint` (line 49). Cross-function reentrancy not possible — no other function modifies `hasMinted` or `totalMinted`.

---

[80] **3. Staticcall to QuizScores — Silent Failure Modes**

`QuizNFT._hasReachedThreshold`, `QuizNFT.getPoints` · Confidence: 80

**Description**
`_hasReachedThreshold` uses `staticcall` to `QuizScores.totalPoints(address)`:
```solidity
(bool success, bytes memory data) = quizScoresContract.staticcall(
    abi.encodeWithSignature("totalPoints(address)", player)
);
if (!success) return false;
if (data.length < 32) return false;
```

Failure modes:
- QuizScores contract not deployed at address → `success=false` → returns `false` (blocks mint)
- QuizScores paused → `totalPoints` is `view` so still works ✓
- QuizScores returns malformed data (<32 bytes) → returns `false`
- QuizScores reverts internally → `success=false` → returns `false`

**Risk**: All failures silently return `false`, blocking legitimate mints. No event/log for debugging. Owner cannot distinguish "not enough points" from "QuizScores broken."

**Fix**
```diff
    function _hasReachedThreshold(address player) internal view returns (bool) {
        (bool success, bytes memory data) = quizScoresContract.staticcall(
            abi.encodeWithSignature("totalPoints(address)", player)
        );
        if (!success) return false;
        if (data.length < 32) return false;
        uint256 points;
        try abi.decode(data, (uint256)) returns (uint256 p) {
            points = p;
        } catch {
            return false;
        }
+       emit PointsQueried(player, points, true);  // Add event for observability
        return points >= pointsThreshold;
    }
+
+   event PointsQueried(address indexed player, uint256 points, bool success);
```

---

[78] **4. `setMaxSupply` Allows Reducing Supply Below Future Minting Needs**

`QuizNFT.setMaxSupply` · Confidence: 78

**Description**
`setMaxSupply` requires `_maxSupply >= totalMinted` but does not account for players who have **already qualified** (reached threshold) but not yet minted. If owner reduces `maxSupply` to just above `totalMinted`, qualified players may be permanently blocked.

**Fix**
```diff
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_maxSupply <= MAX_SUPPLY_CAP, "maxSupply exceeds 100000");
        require(_maxSupply >= totalMinted, "Below minted count");
+       // Consider: require(_maxSupply >= totalMinted + qualifiedButNotMinted, "Blocks qualified players");
        maxSupply = _maxSupply;
    }
```
Note: Tracking "qualified but not minted" requires off-chain indexer or on-chain registry (gas cost).

---

[75] **5. Owner Can Change QuizScores Contract to Malicious One — 2-Step Mitigates**

`QuizNFT.proposeQuizScoresContract`, `QuizNFT.acceptQuizScoresContract` · Confidence: 75

**Description**
Owner can propose a new `QuizScores` contract that:
- Always returns `totalPoints >= pointsThreshold` for any address
- Allows unlimited minting bypassing game logic
- 2-step (propose + accept) prevents accidental change but not malicious owner

**Fix**
No code fix eliminates malicious owner risk. The 2-step pattern is correct. Consider:
- Timelock on `acceptQuizScoresContract` (e.g., 7-day delay)
- Multi-sig ownership
- Off-chain monitoring of contract address changes

---

[75] **6. `baseTokenURI` Change Affects All Existing Tokens — Metadata Mutability**

`QuizNFT.setBaseTokenURI` · Confidence: 75

**Description**
`tokenURI(tokenId)` returns `baseTokenURI + "/" + tokenId + ".json"`. Changing `baseTokenURI` retroactively changes metadata for **all** minted tokens. This violates ERC721 metadata immutability expectations and allows owner to rug token metadata.

**Fix**
Option A — Freeze URI after first mint (simplest):
```diff
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        require(bytes(_baseTokenURI).length > 0, "Empty base URI");
+       require(totalMinted == 0, "Cannot change URI after first mint");
        string memory previous = baseTokenURI;
        baseTokenURI = _baseTokenURI;
        emit BaseURIUpdated(previous, _baseTokenURI);
    }
```

Option B — Per-token URI storage (already using ERC721URIStorage):
```diff
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        require(bytes(_baseTokenURI).length > 0, "Empty base URI");
        string memory previous = baseTokenURI;
        baseTokenURI = _baseTokenURI;
        emit BaseURIUpdated(previous, _baseTokenURI);
    }
+
+   // For new tokens only — existing tokens keep their URI via _setTokenURI
```
Current code already uses `_setTokenURI` per token (line 50-60), so Option B is **already implemented** — `setBaseTokenURI` only affects *future* mints. **Finding demoted to Lead.**

---

## Leads

- **Points Threshold Change Mid-Season** — `QuizNFT.setPointsThreshold` — Code smells: owner can change threshold retroactively — Owner can raise threshold after players qualified but before they mint, blocking them. Or lower threshold to allow more mints. Consider timelock or epoch-based thresholds.
- **No Emergency Mint Recovery** — `QuizNFT` — Code smells: if QuizScores contract breaks permanently, no way to mint — If QuizScores is bricked (wrong address, destroyed, paused indefinitely), qualified players cannot mint. Consider emergency mint function (onlyOwner, strict conditions) or migration path.
- **MAX_SUPPLY_CAP Hardcoded** — `QuizNFT.MAX_SUPPLY_CAP = 100000` — Code smells: constant cannot be upgraded — If more supply needed, requires new contract deployment. Comment acknowledges: "upgrade path: raise constant after audit". Document upgrade procedure.
- **ERC721Enumerable Missing** — `QuizNFT` — Code smells: no on-chain enumeration of token IDs — `totalMinted` tracks count but no `tokenOfOwnerByIndex` / `tokenByIndex`. Off-chain indexers required for wallet UIs. Consider adding ERC721Enumerable if needed.

---

> ⚠️ This review was performed by an AI assistant. AI analysis can never verify the complete absence of vulnerabilities and no guarantee of security is given. Team security reviews, bug bounty programs, and on-chain monitoring are strongly recommended.