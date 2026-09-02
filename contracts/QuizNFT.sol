// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract QuizNFT is ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    // hard ceiling so owner can never set an unbounded supply (upgrade path: raise constant after audit)
    uint256 public constant MAX_SUPPLY_CAP = 100000;
    uint256 public totalMinted;
    string public baseTokenURI;
    address public quizScoresContract;
    uint256 public pointsThreshold;
    mapping(address => bool) public hasMinted;
    uint256 public maxSupply = 10000;
    address public pendingQuizScoresContract;

    event NFTMinted(address indexed player, uint256 tokenId);
    event BaseURIUpdated(string previousURI, string newURI);
    event ThresholdUpdated(uint256 previousThreshold, uint256 newThreshold);
    event QuizContractUpdated(address previousContract, address newContract);

    constructor(
        address _quizScoresContract,
        string memory _baseTokenURI,
        uint256 _pointsThreshold
    ) ERC721("The What of Blockchain", "TWOB") Ownable(msg.sender) {
        require(_quizScoresContract != address(0), "Invalid quiz contract");
        require(bytes(_baseTokenURI).length > 0, "Empty base URI");
        require(_pointsThreshold > 0, "Threshold must be greater than 0");
        quizScoresContract = _quizScoresContract;
        baseTokenURI = _baseTokenURI;
        pointsThreshold = _pointsThreshold;
    }

    function mint() external nonReentrant whenNotPaused {
        require(!hasMinted[msg.sender], "Already minted");
        require(_hasReachedThreshold(msg.sender), "Not enough points");
        require(totalMinted < maxSupply, "Max supply reached");

        hasMinted[msg.sender] = true;
        totalMinted++;
        uint256 tokenId = totalMinted;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(
            tokenId,
            string(
                abi.encodePacked(
                    baseTokenURI,
                    "/",
                    Strings.toString(tokenId),
                    ".json"
                )
            )
        );

        emit NFTMinted(msg.sender, tokenId);
    }

    function _hasReachedThreshold(address player) internal view returns (bool) {
        (bool success, bytes memory data) = quizScoresContract.staticcall(
            abi.encodeWithSignature("totalPoints(address)", player)
        );
        if (!success) return false;
        if (data.length < 32) return false;
        uint256 points = abi.decode(data, (uint256));
        return points >= pointsThreshold;
    }

    function canMint(address player) external view returns (bool) {
        return !hasMinted[player] && _hasReachedThreshold(player);
    }

    function getPoints(address player) external view returns (uint256) {
        (bool success, bytes memory data) = quizScoresContract.staticcall(
            abi.encodeWithSignature("totalPoints(address)", player)
        );
        if (!success) return 0;
        if (data.length < 32) return 0;
        return abi.decode(data, (uint256));
    }

    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        require(bytes(_baseTokenURI).length > 0, "Empty base URI");
        string memory previous = baseTokenURI;
        baseTokenURI = _baseTokenURI;
        emit BaseURIUpdated(previous, _baseTokenURI);
    }

    function setPointsThreshold(uint256 _pointsThreshold) external onlyOwner {
        require(_pointsThreshold > 0, "Threshold must be greater than 0");
        uint256 previous = pointsThreshold;
        pointsThreshold = _pointsThreshold;
        emit ThresholdUpdated(previous, _pointsThreshold);
    }

    function proposeQuizScoresContract(address _quizScoresContract) external onlyOwner {
        require(_quizScoresContract != address(0), "Invalid address");
        pendingQuizScoresContract = _quizScoresContract;
    }

    function acceptQuizScoresContract() external onlyOwner {
        require(pendingQuizScoresContract != address(0), "No pending contract");
        address previous = quizScoresContract;
        quizScoresContract = pendingQuizScoresContract;
        pendingQuizScoresContract = address(0);
        emit QuizContractUpdated(previous, quizScoresContract);
    }

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply > 0, "Max supply must be > 0");
        require(_maxSupply <= MAX_SUPPLY_CAP, "maxSupply exceeds 100000");
        require(_maxSupply >= totalMinted, "Below minted count");
        maxSupply = _maxSupply;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
