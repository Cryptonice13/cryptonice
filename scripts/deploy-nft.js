const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying NFT and Marketplace contracts...");

  // Deploy NFT contract
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFT contract deployed to:", nftAddress);

  // Deploy Marketplace contract
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace contract deployed to:", marketplaceAddress);

  // Update contracts.ts with new addresses
  const contractsPath = path.join(__dirname, "../src/config/contracts.ts");
  let contractsContent = fs.readFileSync(contractsPath, "utf8");

  // Add NFT contract addresses
  if (!contractsContent.includes("NFT_CONTRACT_ADDRESS")) {
    contractsContent = contractsContent.replace(
      "export const LENDING_POOL_ADDRESS",
      `export const NFT_CONTRACT_ADDRESS = "${nftAddress}";\nexport const MARKETPLACE_CONTRACT_ADDRESS = "${marketplaceAddress}";\n\nexport const LENDING_POOL_ADDRESS`
    );
    fs.writeFileSync(contractsPath, contractsContent);
    console.log("Updated contracts.ts with NFT addresses");
  }

  console.log("\nDeployment complete!");
  console.log("NFT Address:", nftAddress);
  console.log("Marketplace Address:", marketplaceAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
