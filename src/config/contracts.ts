// Mock ABIs for development - these would be replaced with actual compiled ABIs
const LendingPoolABI = [
  "function deposit(address asset, uint256 amount) external",
  "function withdraw(address asset, uint256 amount) external",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode) external",
  "function repay(address asset, uint256 amount, uint256 rateMode) external",
  "function getUserAccountData(address user) external view returns (uint256, uint256, uint256, uint256, uint256, uint256)"
];

const ATokenABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

const DebtTokenABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

const InterestRateModelABI = [
  "function getSupplyRate(uint256 cash, uint256 borrows, uint256 reserves, uint256 reserveFactorMantissa) external view returns (uint256)"
];

export const CONTRACT_ADDRESSES = {
  LENDING_POOL: '0x1234567890123456789012345678901234567890',
  PRICE_ORACLE: '0x2345678901234567890123456789012345678901',
} as const;

export const ABIS = {
  LENDING_POOL: LendingPoolABI,
  A_TOKEN: ATokenABI,
  DEBT_TOKEN: DebtTokenABI,
  INTEREST_RATE_MODEL: InterestRateModelABI,
} as const;

export const getContractConfig = (contractName: keyof typeof CONTRACT_ADDRESSES) => ({
  address: CONTRACT_ADDRESSES[contractName],
  abi: ABIS[contractName as keyof typeof ABIS],
});