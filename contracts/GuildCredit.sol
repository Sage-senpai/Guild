// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  GuildCredit
 * @notice ERC-20 credit token for the Guild marketplace.
 *         Credits are minted by the treasury upon top-up payments and burned
 *         when users pay for agent runs or post task rewards.
 *
 * Security properties:
 *  - Only MINTER_ROLE can mint (treasury / payment processor)
 *  - Only BURNER_ROLE can burn from arbitrary addresses (GuildEscrow)
 *  - Owners can burn their own balance via `burn()`
 *  - No transfer restrictions beyond standard ERC-20
 *  - Pausable by DEFAULT_ADMIN_ROLE for emergency stops
 *  - Upgradeability: intentionally absent; deploy a new contract + migration
 *
 * Audit notes:
 *  - No integer overflow risk: Solidity 0.8.x checked arithmetic is default
 *  - Role separation prevents a single compromised key from both minting and pausing
 *  - `permit()` (EIP-2612) allows gasless approvals for better UX
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract GuildCredit is ERC20, ERC20Permit, ERC20Burnable, AccessControl, Pausable {
    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // 1 credit = 1e18 base units (18 decimals, same as ETH)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1 billion GUILD credits

    // ── Events ────────────────────────────────────────────────────────────────
    event CreditsMinted(address indexed to, uint256 amount, string reason);
    event CreditsBurned(address indexed from, uint256 amount, string reason);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address admin) ERC20("Guild Credit", "GUILD") ERC20Permit("Guild Credit") {
        require(admin != address(0), "GuildCredit: zero admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ── Mint ──────────────────────────────────────────────────────────────────

    /**
     * @notice Mint credits to a recipient (treasury top-up).
     * @param to      Recipient address.
     * @param amount  Amount in base units (1 credit = 1e18).
     * @param reason  Human-readable reason (for off-chain indexing).
     */
    function mintCredits(
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "GuildCredit: mint to zero");
        require(amount > 0, "GuildCredit: zero amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "GuildCredit: cap exceeded");

        _mint(to, amount);
        emit CreditsMinted(to, amount, reason);
    }

    // ── Burn (authorised) ──────────────────────────────────────────────────────

    /**
     * @notice Burn credits from an account (e.g. escrow spending credits).
     *         Requires BURNER_ROLE; the `from` address must have approved the
     *         caller OR the caller must be the escrow holding funds.
     *         Designed for GuildEscrow to deduct credits atomically.
     */
    function burnFrom(
        address from,
        uint256 amount,
        string calldata reason
    ) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(from != address(0), "GuildCredit: burn from zero");
        require(amount > 0, "GuildCredit: zero amount");

        uint256 currentAllowance = allowance(from, _msgSender());
        require(currentAllowance >= amount, "GuildCredit: burn exceeds allowance");
        unchecked {
            _approve(from, _msgSender(), currentAllowance - amount);
        }
        _burn(from, amount);
        emit CreditsBurned(from, amount, reason);
    }

    // ── Pause ─────────────────────────────────────────────────────────────────

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ── Hooks ─────────────────────────────────────────────────────────────────

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }

    // ── Introspection ─────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
