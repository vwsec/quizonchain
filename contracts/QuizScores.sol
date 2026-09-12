// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract QuizScores is ReentrancyGuard, Ownable {
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
    event MaxTotalUpdated(uint8 previousMaxTotal, uint8 newMaxTotal);
    event ScoreCleared(address indexed player);

    constructor(address initialTrustedSigner) Ownable(msg.sender) {
        require(initialTrustedSigner != address(0), "Signer cannot be zero");
        trustedSigner = initialTrustedSigner;
        emit TrustedSignerUpdated(address(0), initialTrustedSigner);
    }

    function submitScore(uint8 score, uint8 total, bytes calldata sig) external nonReentrant {
        uint256 previousSubmissionAt = lastSubmissionAt[msg.sender];
        require(
            block.timestamp >= previousSubmissionAt + cooldownPeriod,
            "Submission cooldown active"
        );

        require(total == maxTotal, "Total must equal max total");
        require(score <= total, "Score cannot exceed total");
        require(_isValidSignature(msg.sender, score, total, sig), "Invalid signature");

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
        require(newCooldown >= 5 minutes, "Cooldown too short");
        require(newCooldown <= 24 hours, "Cooldown too long");
        uint256 previousCooldown = cooldownPeriod;
        cooldownPeriod = newCooldown;
        emit CooldownPeriodUpdated(previousCooldown, newCooldown);
    }

    function setTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Signer cannot be zero");
        address previousSigner = trustedSigner;
        trustedSigner = newSigner;
        emit TrustedSignerUpdated(previousSigner, newSigner);
    }

    function setMaxTotal(uint8 newMaxTotal) external onlyOwner {
        require(newMaxTotal >= 1, "Max total too low");
        require(newMaxTotal <= 20, "Max total too high");
        uint8 previousMaxTotal = maxTotal;
        maxTotal = newMaxTotal;
        emit MaxTotalUpdated(previousMaxTotal, newMaxTotal);
    }

    function clearScore(address player) external onlyOwner {
        delete scores[player];
        delete lastSubmissionAt[player];
        emit ScoreCleared(player);
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

    function getTimeUntilNextSubmission(address player) external view returns (uint256) {
        uint256 nextAllowed = lastSubmissionAt[player] + cooldownPeriod;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    function _isValidSignature(
        address player,
        uint8 score,
        uint8 total,
        bytes calldata sig
    ) internal view returns (bool) {
        bytes32 digest = keccak256(
            abi.encode(player, score, total, nonces[player], block.chainid, address(this))
        ).toEthSignedMessageHash();
        return digest.recover(sig) == trustedSigner;
    }
}
