import LendingPoolABI from '@/contracts/LendingPool.json';
import ATokenABI from '@/contracts/AToken.json';
import DebtTokenABI from '@/contracts/DebtToken.json';
import InterestRateModelABI from '@/contracts/InterestRateModel.json';

export const CONTRACT_ADDRESSES = {
  LENDING_POOL: '0x1234567890123456789012345678901234567890',
  PRICE_ORACLE: '0x2345678901234567890123456789012345678901',
} as const;

export const ABIS = {
  LENDING_POOL: LendingPoolABI.abi,
  A_TOKEN: ATokenABI.abi,
  DEBT_TOKEN: DebtTokenABI.abi,
  INTEREST_RATE_MODEL: InterestRateModelABI.abi,
} as const;

export const getContractConfig = (contractName: keyof typeof CONTRACT_ADDRESSES) => ({
  address: CONTRACT_ADDRESSES[contractName],
  abi: ABIS[contractName as keyof typeof ABIS],
});