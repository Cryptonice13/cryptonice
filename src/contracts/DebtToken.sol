// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DebtToken (non-transferable debt shares, per-asset)
 * @notice Represents a borrower's proportional share of the total borrows for an asset.
 * - balanceOf(user) = user's debt shares (not the actual debt amount).
 * - Actual debt = shares * borrowIndex / 1e18 (borrowIndex comes from the pool).
 * - Non-transferable to avoid weirdness; minted/burned by the pool.
 */
contract DebtToken is ERC20, Ownable {
    address public pool;

    error NotPool();
    error NonTransferable();

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {}

    function setPool(address _pool) external onlyOwner {
        pool = _pool;
    }

    modifier onlyPool() {
        if (msg.sender != pool) revert NotPool();
        _;
    }

    function mint(address to, uint256 shares) external onlyPool {
        _mint(to, shares);
    }

    function burn(address from, uint256 shares) external onlyPool {
        _burn(from, shares);
    }

    // Make it non-transferable
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) revert NonTransferable();
        super._update(from, to, value);
    }
}
