// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AToken (interest-bearing deposit token, per-asset)
 * @notice Minted/burned by the LendingPool. Exchange rate is computed in the pool.
 * - Non-rebasing: interest is reflected via exchangeRate growing over time.
 */
contract AToken is ERC20, Ownable {
    address public immutable underlying;   // ERC20
    address public pool;

    error NotPool();

    constructor(
        address _underlying,
        string memory _name,
        string memory _symbol,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        underlying = _underlying;
    }

    function setPool(address _pool) external onlyOwner {
        pool = _pool;
    }

    modifier onlyPool() {
        if (msg.sender != pool) revert NotPool();
        _;
    }

    /**
     * @dev Mint aTokens to `to` representing `underlyingAmount` worth at current exchangeRate.
     * @param to recipient of aTokens
     * @param shares amount of aTokens (already precomputed by pool)
     */
    function mint(address to, uint256 shares) external onlyPool {
        _mint(to, shares);
    }

    /**
     * @dev Burn aTokens from `from` for `shares`.
     */
    function burn(address from, uint256 shares) external onlyPool {
        _burn(from, shares);
    }
}
