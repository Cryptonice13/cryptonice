// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Kinked interest model (Compound/Aave-style)
 * @notice All rates are per-second with 1e18 precision.
 * utilization U = borrows / (cash + borrows - reserves)
 */
contract InterestRateModel {
    uint256 public immutable uOptE18;   // optimal utilization, e.g. 0.8e18
    uint256 public immutable rBaseE18;  // base borrow rate per second
    uint256 public immutable slope1E18; // slope before kink
    uint256 public immutable slope2E18; // slope after kink

    constructor(
        uint256 _uOptE18,
        uint256 _rBaseE18,
        uint256 _slope1E18,
        uint256 _slope2E18
    ) {
        require(_uOptE18 > 0 && _uOptE18 < 1e18, "bad uOpt");
        uOptE18 = _uOptE18;
        rBaseE18 = _rBaseE18;
        slope1E18 = _slope1E18;
        slope2E18 = _slope2E18;
    }

    function borrowRatePerSecond(uint256 utilE18) public view returns (uint256) {
        if (utilE18 <= uOptE18) {
            // r_borrow = rBase + slope1 * (U / Uopt)
            return rBaseE18 + (slope1E18 * utilE18) / uOptE18;
        } else {
            // r_borrow = rBase + slope1 + slope2 * ((U - Uopt) / (1 - Uopt))
            uint256 over = utilE18 - uOptE18;
            return rBaseE18 + slope1E18 + (slope2E18 * over) / (1e18 - uOptE18);
        }
    }

    /**
     * @dev supplyRate = borrowRate * U * (1 - reserveFactor)
     * @param utilE18 utilization 1e18
     * @param reserveFactorE4 reserve factor in basis points (1e4 = 100%)
     */
    function supplyRatePerSecond(uint256 utilE18, uint256 reserveFactorE4) external view returns (uint256) {
        uint256 rb = borrowRatePerSecond(utilE18);
        // multiply by utilization and (1 - reserveFactor)
        return (rb * utilE18 / 1e18) * (10000 - reserveFactorE4) / 10000;
    }
}
