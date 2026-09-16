// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract QuizScores is ReentrancyGuard, Ownable2Step, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Score {
        uint8 score;
        uint8 total;
        uint256 timestamp;
    }

    mapping(address => Score) public scores;
    mapping(address => uint256) public lastSubmissionAt;
    mapping(address => uint256) public nonces;
    uint256 public cooldownPeriod = 1 hours;
    uint8 public maxTotal = 5;
    address public trustedSigner;
    address public pendingTrustedSigner;

    address[] public players;
    mapping(address => bool) public hasPlayed;
    mapping(address => uint256) public totalPoints;
    mapping(address => uint256) public totalGames;

    event ScoreSubmitted(
        address indexed player,
        uint8 score,
        uint8 total,
        uint256 timestamp
    );
    event CooldownUpdated(
        address indexed player,
        uint256 lastSubmissionAt,
        uint256 nextAllowedAt
    );
    event CooldownPeriodUpdated(uint256 previousCooldown, uint256 newCooldown);
    event TrustedSignerUpdated(address indexed previousSigner, address indexed newSigner);
    event TrustedSignerTransferStarted(address indexed currentSigner, address indexed pendingSigner);
    event MaxTotalUpdated(uint8 previousMaxTotal, uint8 newMaxTotal);

    // digest matches /api/sign-score (6 fields, no DOMAIN_SEPARATOR) so already-deployed
    // mainnets keep working. Do NOT add DOMAIN_SEPARATOR here unless the signer route is updated in lockstep.
    constructor(address initialTrustedSigner) Ownable(msg.sender) {
        require(initialTrustedSigner != address(0), "Signer cannot be zero");
        trustedSigner = initialTrustedSigner;
        emit TrustedSignerUpdated(address(0), initialTrustedSigner);
    }

    function submitScore(uint8 score, uint8 total, bytes calldata sig) external nonReentrant whenNotPaused {
        uint256 previousSubmissionAt = lastSubmissionAt[msg.sender];
        require(
            block.timestamp >= previousSubmissionAt + cooldownPeriod,
            "Submission cooldown active"
        );

        require(total == maxTotal, "Total must equal max total");
        require(score <= total, "Score cannot exceed total");
        require(_isValidSignature(msg.sender, score, total, sig, nonces[msg.sender]), "Invalid signature");

        scores[msg.sender] = Score(score, total, block.timestamp);
        lastSubmissionAt[msg.sender] = block.timestamp;
        nonces[msg.sender]++;

        totalPoints[msg.sender] += score;
        totalGames[msg.sender]++;
        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            players.push(msg.sender);
        }

        emit ScoreSubmitted(msg.sender, score, total, block.timestamp);
        emit CooldownUpdated(
            msg.sender,
            block.timestamp,
            block.timestamp + cooldownPeriod
        );
    }

    function setCooldownPeriod(uint256 newCooldown) external onlyOwner {
        require(newCooldown <= 24 hours, "Cooldown too long");
        uint256 previousCooldown = cooldownPeriod;
        cooldownPeriod = newCooldown;
        emit CooldownPeriodUpdated(previousCooldown, newCooldown);
    }

    // 2-step transfer: propose, then the new signer accepts. Prevents a mistyped
    // address from silently bricking score submission.
    function setTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Signer cannot be zero");
        pendingTrustedSigner = newSigner;
        emit TrustedSignerTransferStarted(trustedSigner, newSigner);
    }

    function acceptTrustedSigner() external {
        require(msg.sender == pendingTrustedSigner, "Not pending signer");
        address previousSigner = trustedSigner;
        trustedSigner = pendingTrustedSigner;
        pendingTrustedSigner = address(0);
        emit TrustedSignerUpdated(previousSigner, trustedSigner);
    }

    function setMaxTotal(uint8 newMaxTotal) external onlyOwner {
        require(newMaxTotal >= 1, "Max total too low");
        require(newMaxTotal <= 20, "Max total too high");
        uint8 previousMaxTotal = maxTotal;
        maxTotal = newMaxTotal;
        emit MaxTotalUpdated(previousMaxTotal, newMaxTotal);
    }

    function getScore(address player) external view returns (Score memory) {
        return scores[player];
    }

    function getLeaderboard() external view returns (
        address[] memory addrs,
        uint256[] memory points,
        uint256[] memory games
    ) {
        uint256 len = players.length;
        addrs = new address[](len);
        points = new uint256[](len);
        games = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            addrs[i] = players[i];
            points[i] = totalPoints[players[i]];
            games[i] = totalGames[players[i]];
        }
        return (addrs, points, games);
    }

    // paginated read to avoid unbounded return as players grows.
    function getLeaderboardPage(uint256 offset, uint256 limit) external view returns (
        address[] memory addrs,
        uint256[] memory points,
        uint256[] memory games
    ) {
        uint256 len = players.length;
        if (offset >= len) {
            return (new address[](0), new uint256[](0), new uint256[](0));
        }
        uint256 end = offset + limit;
        if (end > len || limit == 0) end = len;
        uint256 outLen = end - offset;
        addrs = new address[](outLen);
        points = new uint256[](outLen);
        games = new uint256[](outLen);
        for (uint256 i = offset; i < end; i++) {
            addrs[i - offset] = players[i];
            points[i - offset] = totalPoints[players[i]];
            games[i - offset] = totalGames[players[i]];
        }
        return (addrs, points, games);
    }

    function getTopPlayers(uint256 count) external view returns (
        address[] memory addrs,
        uint256[] memory points,
        uint256[] memory games
    ) {
        uint256 len = players.length;
        if (len == 0) {
            return (new address[](0), new uint256[](0), new uint256[](0));
        }
        uint256[] memory indices = new uint256[](len);
        for (uint256 i; i < len; i++) indices[i] = i;
        for (uint256 i = 1; i < len; i++) {
            uint256 key = indices[i];
            uint256 j = i;
            while (j > 0 && totalPoints[players[indices[j - 1]]] < totalPoints[players[key]]) {
                indices[j] = indices[j - 1];
                if (j-- == 1) break;
            }
            indices[j] = key;
        }
        uint256 outLen = count > len ? len : count;
        addrs = new address[](outLen);
        points = new uint256[](outLen);
        games = new uint256[](outLen);
        for (uint256 i; i < outLen; i++) {
            addrs[i] = players[indices[i]];
            points[i] = totalPoints[players[indices[i]]];
            games[i] = totalGames[players[indices[i]]];
        }
        return (addrs, points, games);
    }

    function getTimeUntilNextSubmission(address player) external view returns (uint256) {
        uint256 nextAllowed = lastSubmissionAt[player] + cooldownPeriod;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

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
            )
        ).toEthSignedMessageHash();
        return digest.recover(sig) == trustedSigner;
    }
}
