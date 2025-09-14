#!/bin/bash

echo "Setting up frontend with contract artifacts..."

# Create contracts directory if it doesn't exist
mkdir -p src/contracts

# Copy contract ABIs
echo "Copying contract artifacts..."
cp artifacts/contracts/LendingPool.sol/LendingPool.json src/contracts/LendingPool.json
cp artifacts/contracts/AToken.sol/AToken.json src/contracts/AToken.json  
cp artifacts/contracts/DebtToken.sol/DebtToken.json src/contracts/DebtToken.json
cp artifacts/contracts/InterestRateModel.sol/InterestRateModel.json src/contracts/InterestRateModel.json
cp artifacts/contracts/MockERC20.sol/MockERC20.json src/contracts/MockERC20.json
cp artifacts/contracts/MockPriceOracle.sol/MockPriceOracle.json src/contracts/MockPriceOracle.json

echo "Frontend setup complete!"
echo "Don't forget to update addresses in src/config/contracts.ts with deployed addresses"