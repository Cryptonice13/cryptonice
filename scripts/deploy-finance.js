const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Finance contracts (LoanFactory & StakingPool)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MockERC20 for lending token (USDC)
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const lendingToken = await MockERC20.deploy("USD Coin", "USDC", 6);
  await lendingToken.waitForDeployment();
  const lendingTokenAddress = await lendingToken.getAddress();
  console.log("✅ Lending Token (USDC) deployed to:", lendingTokenAddress);

  // Deploy MockERC20 for staking token (CRDX)
  const stakingToken = await MockERC20.deploy("Cryptonice Token", "CRDX", 18);
  await stakingToken.waitForDeployment();
  const stakingTokenAddress = await stakingToken.getAddress();
  console.log("✅ Staking Token (CRDX) deployed to:", stakingTokenAddress);

  // Deploy MockERC20 for reward token (same as staking token)
  const rewardTokenAddress = stakingTokenAddress;

  // Deploy LoanFactory
  const LoanFactory = await hre.ethers.getContractFactory("LoanFactory");
  const loanFactory = await LoanFactory.deploy(lendingTokenAddress);
  await loanFactory.waitForDeployment();
  const loanFactoryAddress = await loanFactory.getAddress();
  console.log("✅ LoanFactory deployed to:", loanFactoryAddress);

  // Deploy StakingPool
  const StakingPool = await hre.ethers.getContractFactory("StakingPool");
  const stakingPool = await StakingPool.deploy(stakingTokenAddress, rewardTokenAddress);
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  console.log("✅ StakingPool deployed to:", stakingPoolAddress);

  // Fund staking pool with reward tokens
  const rewardAmount = hre.ethers.parseEther("1000000");
  await stakingToken.mint(stakingPoolAddress, rewardAmount);
  console.log("✅ StakingPool funded with rewards");

  // Update contracts.ts file
  const contractsPath = path.join(__dirname, "..", "src", "config", "contracts.ts");
  let contractsContent = fs.readFileSync(contractsPath, "utf8");

  // Update contract addresses
  contractsContent = contractsContent.replace(
    /LOAN_FACTORY: '0x[a-fA-F0-9]{40}'/,
    `LOAN_FACTORY: '${loanFactoryAddress}'`
  );
  contractsContent = contractsContent.replace(
    /STAKING_POOL: '0x[a-fA-F0-9]{40}'/,
    `STAKING_POOL: '${stakingPoolAddress}'`
  );
  contractsContent = contractsContent.replace(
    /LENDING_TOKEN: '0x[a-fA-F0-9]{40}'/,
    `LENDING_TOKEN: '${lendingTokenAddress}'`
  );
  contractsContent = contractsContent.replace(
    /STAKING_TOKEN: '0x[a-fA-F0-9]{40}'/,
    `STAKING_TOKEN: '${stakingTokenAddress}'`
  );

  fs.writeFileSync(contractsPath, contractsContent);
  console.log("✅ contracts.ts updated with new addresses");

  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Lending Token (USDC):", lendingTokenAddress);
  console.log("Staking Token (CRDX):", stakingTokenAddress);
  console.log("LoanFactory:", loanFactoryAddress);
  console.log("StakingPool:", stakingPoolAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
