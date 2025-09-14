// Contract ABIs and addresses - updated after deployment
export const CONTRACT_ADDRESSES = {
  LENDING_POOL: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Update after deployment
  PRICE_ORACLE: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Update after deployment
  USDC: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // Update after deployment
  USDT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // Update after deployment
} as const;

// Full contract ABIs will be imported from compiled artifacts
const LendingPoolABI = [
  "function deposit(address asset, uint256 amount) external payable",
  "function withdraw(address asset, uint256 shares) external",
  "function borrow(address asset, uint256 amount, address[] calldata allAssets) external",
  "function repay(address asset, uint256 amount, address onBehalfOf) external payable",
  "function getUserAccountData(address user, address[] calldata allAssets) external view returns (uint256 totalCollateralE18, uint256 totalDebtE18, uint256 healthFactorE18)",
  "function collateralOf(address asset, address user) external view returns (uint256)",
  "function debtOf(address asset, address user) external view returns (uint256)",
  "function getExchangeRateE18(address asset) external view returns (uint256)",
  "function accrueInterest(address asset) external"
];

const ERC20ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function faucet(address to, uint256 amount) external"
];

const ATokenABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function underlying() external view returns (address)"
];

export const ABIS = {
  LENDING_POOL: LendingPoolABI,
  ERC20: ERC20ABI,
  A_TOKEN: ATokenABI,
} as const;

export const CONTRACTS = {
  lendingPool: {
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: ABIS.LENDING_POOL
  },
  usdc: {
    address: CONTRACT_ADDRESSES.USDC,
    abi: ABIS.ERC20
  },
  usdt: {
    address: CONTRACT_ADDRESSES.USDT,
    abi: ABIS.ERC20
  }
};

export const getContractConfig = (contractName: keyof typeof CONTRACT_ADDRESSES) => ({
  address: CONTRACT_ADDRESSES[contractName],
  abi: ABIS.LENDING_POOL,
});