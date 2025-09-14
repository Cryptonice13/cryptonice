const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DeFi Lending Protocol...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy Mock Price Oracle first
  console.log("\n1. Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await MockPriceOracle.deploy();
  await oracle.waitForDeployment();
  console.log("MockPriceOracle deployed to:", await oracle.getAddress());

  // Deploy Interest Rate Model
  console.log("\n2. Deploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy(
    ethers.parseEther("0.8"), // uOptE18 = 80% optimal utilization
    ethers.parseEther("0.02") / BigInt(365 * 24 * 3600), // rBaseE18 = 2% per year
    ethers.parseEther("0.1") / BigInt(365 * 24 * 3600),  // slope1E18 = 10% per year
    ethers.parseEther("0.5") / BigInt(365 * 24 * 3600)   // slope2E18 = 50% per year
  );
  await interestRateModel.waitForDeployment();
  console.log("InterestRateModel deployed to:", await interestRateModel.getAddress());

  // Deploy LendingPool
  console.log("\n3. Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    await oracle.getAddress(),
    deployer.address // admin
  );
  await lendingPool.waitForDeployment();
  console.log("LendingPool deployed to:", await lendingPool.getAddress());

  // Deploy Mock ERC20 tokens for testing
  console.log("\n4. Deploying Mock Tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  console.log("USDC deployed to:", await usdc.getAddress());

  const usdt = await MockERC20.deploy("Tether USD", "USDT", 6);
  await usdt.waitForDeployment();
  console.log("USDT deployed to:", await usdt.getAddress());

  // Set prices in oracle
  console.log("\n5. Setting prices in oracle...");
  await oracle.setPrice(await usdc.getAddress(), ethers.parseEther("1")); // $1
  await oracle.setPrice(await usdt.getAddress(), ethers.parseEther("1")); // $1
  await oracle.setPrice("0x0000000000000000000000000000000000000000", ethers.parseEther("3000")); // ETH = $3000

  // List markets in lending pool
  console.log("\n6. Listing markets...");
  
  // List ETH
  await lendingPool.listMarket(
    "0x0000000000000000000000000000000000000000", // ETH
    await interestRateModel.getAddress(),
    8000, // 80% LTV
    8500, // 85% liquidation threshold
    1000, // 10% liquidation bonus
    1000  // 10% reserve factor
  );

  // List USDC
  await lendingPool.listMarket(
    await usdc.getAddress(),
    await interestRateModel.getAddress(),
    8500, // 85% LTV
    9000, // 90% liquidation threshold
    500,  // 5% liquidation bonus
    1000  // 10% reserve factor
  );

  // List USDT
  await lendingPool.listMarket(
    await usdt.getAddress(),
    await interestRateModel.getAddress(),
    8500, // 85% LTV
    9000, // 90% liquidation threshold
    500,  // 5% liquidation bonus
    1000  // 10% reserve factor
  );

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("MockPriceOracle:", await oracle.getAddress());
  console.log("InterestRateModel:", await interestRateModel.getAddress());
  console.log("LendingPool:", await lendingPool.getAddress());
  console.log("USDC:", await usdc.getAddress());
  console.log("USDT:", await usdt.getAddress());
  console.log("\nCopy these addresses to src/config/contracts.ts");

  // Fund deployer with test tokens
  console.log("\n7. Funding deployer with test tokens...");
  await usdc.faucet(deployer.address, ethers.parseUnits("10000", 6));
  await usdt.faucet(deployer.address, ethers.parseUnits("10000", 6));
  console.log("Funded deployer with 10,000 USDC and 10,000 USDT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });