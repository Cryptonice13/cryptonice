// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPriceOracle for testing
 */
contract MockPriceOracle is Ownable {
    mapping(address => uint256) public prices;

    constructor() Ownable(msg.sender) {}

    function setPrice(address asset, uint256 priceE18) external onlyOwner {
        prices[asset] = priceE18;
    }

    function getPrice(address asset) external view returns (uint256) {
        uint256 price = prices[asset];
        require(price > 0, "Price not set");
        return price;
    }
}