// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  GuildAgent
 * @notice ERC-721 NFT representing a published AI agent on the Guild marketplace.
 *
 *         Each token corresponds to one agent manifest stored on IPFS/Crust Network.
 *         The token URI points to the IPFS manifest CID, providing a permanent,
 *         verifiable on-chain record of every agent's identity.
 *
 * Features:
 *  - ERC-721 with per-token URI storage
 *  - Creator royalty support (ERC-2981) at 5% default
 *  - Soulbound option: creator can lock transfer on their own agent NFT
 *  - Only MINTER_ROLE (Guild backend) can mint
 *  - Pausable by admin
 *
 * Audit fixes applied:
 *  - M-1: Removed deprecated OZ Counters.sol; uses plain uint256 (OZ v5 compatible)
 *
 * Security notes:
 *  - Token IDs are 1-indexed sequential; no collision risk
 *  - _safeMint used throughout to protect against non-receiver contracts
 *  - No ETH value transfers; re-entrancy is not a material risk
 *  - URI is set once at mint and is immutable
 *  - Royalty receiver is the creator at mint time; 500 bps (5%)
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract GuildAgent is ERC721, ERC721URIStorage, ERC721Royalty, AccessControl, Pausable {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Plain uint256 counter — OZ v5 removed Counters.sol
    uint256 private _tokenIds;

    mapping(uint256 => bool)    public soulbound;
    mapping(uint256 => address) public creators;

    uint96 public constant DEFAULT_ROYALTY_BPS = 500;

    event AgentMinted(uint256 indexed tokenId, address indexed creator, string manifestCid, bool isSoulbound);
    event SoulboundToggled(uint256 indexed tokenId, bool locked);

    constructor(address admin) ERC721("Guild Agent", "GAGENT") {
        require(admin != address(0), "GuildAgent: zero admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function mintAgent(
        address creator,
        string calldata manifestCid,
        bool lockTransfer
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256 tokenId) {
        require(creator != address(0), "GuildAgent: zero creator");
        require(bytes(manifestCid).length > 0, "GuildAgent: empty CID");

        tokenId = ++_tokenIds;

        _safeMint(creator, tokenId);
        _setTokenURI(tokenId, string.concat("ipfs://", manifestCid));
        _setTokenRoyalty(tokenId, creator, DEFAULT_ROYALTY_BPS);

        creators[tokenId]  = creator;
        soulbound[tokenId] = lockTransfer;

        emit AgentMinted(tokenId, creator, manifestCid, lockTransfer);
    }

    function setSoulbound(uint256 tokenId, bool locked) external {
        require(ownerOf(tokenId) == _msgSender(), "GuildAgent: not owner");
        soulbound[tokenId] = locked;
        emit SoulboundToggled(tokenId, locked);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override whenNotPaused returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && soulbound[tokenId]) {
            revert("GuildAgent: token is soulbound");
        }
        return super._update(to, tokenId, auth);
    }

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function totalMinted() external view returns (uint256) { return _tokenIds; }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    { return super.tokenURI(tokenId); }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, ERC721Royalty, AccessControl) returns (bool)
    { return super.supportsInterface(interfaceId); }
}
