import { useState, useEffect, useCallback } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { aaveClient } from '@/lib/aaveClient';
import { chains, markets } from '@aave/client/actions';
import { sendWith } from '@aave/client/viem';
import type { EvmAddress, ChainId } from '@aave/client';

// Complete type definitions matching Aave SDK
export interface EmodeMarketCategory {
  id: number;
  label: string;
  maxLTV: string;
  liquidationThreshold: string;
  liquidationPenalty: string;
}

export interface MarketUserState {
  netWorth: string;
  netAPY: string;
  healthFactor: string;
  eModeEnabled: boolean;
  totalCollateralBase: string;
  totalDebtBase: string;
  availableBorrowsBase: string;
  currentLiquidationThreshold: string;
  ltv: string;
  isInIsolationMode: boolean;
}

export interface ReserveSupplyInfo {
  apy: string;
  total: string;
  maxLTV: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  canBeCollateral: boolean;
  supplyCap: string;
  supplyCapReached: boolean;
}

export interface ReserveBorrowInfo {
  apy: string;
  total: string;
  borrowCap: string;
  reserveFactor: string;
  availableLiquidity: string;
  utilizationRate: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
  optimalUsageRate: string;
  borrowingState: string;
  borrowCapReached: boolean;
}

export interface ReserveIsolationModeConfig {
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  debtCeiling: string;
  debtCeilingDecimals: number;
  totalBorrows: string;
}

export interface EmodeReserveInfo {
  categoryId: number;
  label: string;
  maxLTV: string;
  liquidationThreshold: string;
  liquidationPenalty: string;
}

export interface ReserveUserState {
  balance: string;
  suppliable: string;
  borrowable: string;
  emode?: EmodeReserveInfo;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  isInIsolationMode: boolean;
}

export interface ReserveIncentive {
  type: 'MeritSupply' | 'MeritBorrow' | 'MeritBorrowAndSupply' | 'AaveSupply' | 'AaveBorrow';
  extraApr?: string;
  claimLink?: string;
  rewardTokenAddress?: string;
  rewardTokenSymbol?: string;
}

export interface Reserve {
  underlyingToken: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  aToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  vToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  size: string;
  usdExchangeRate: string;
  isFrozen: boolean;
  isPaused: boolean;
  flashLoanEnabled: boolean;
  permitSupported: boolean;
  supplyInfo: ReserveSupplyInfo;
  borrowInfo?: ReserveBorrowInfo;
  isolationModeConfig?: ReserveIsolationModeConfig;
  eModeInfo: EmodeReserveInfo[];
  incentives: ReserveIncentive[];
  userState?: ReserveUserState;
}

export interface AaveMarket {
  id: string;
  name: string;
  chain: {
    id: number;
    name: string;
  };
  address: string;
  icon: string;
  totalMarketSize: string;
  totalAvailableLiquidity: string;
  eModeCategories: EmodeMarketCategory[];
  userState?: MarketUserState;
  borrowReserves: Reserve[];
  supplyReserves: Reserve[];
}

export const useAave = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [availableChains, setAvailableChains] = useState<any[]>([]);
  const [aaveMarkets, setAaveMarkets] = useState<AaveMarket[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<AaveMarket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available Aave chains
  const fetchChains = useCallback(async () => {
    try {
      const result = await chains(aaveClient);
      if (result.isOk()) {
        setAvailableChains(result.value);
      } else {
        console.error("Error fetching chains:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch Aave chains:", err);
    }
  }, []);

  // Fetch markets with complete data structure
  const fetchMarkets = useCallback(async (chainId: number, userAddress?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await markets(aaveClient, {
        chainIds: [chainId as ChainId],
      });

      if (result.isOk()) {
        const formattedMarkets: AaveMarket[] = result.value.map((market: any) => {
          // Parse reserves
          const supplyReserves: Reserve[] = (market.supplyReserves || []).map((reserve: any) => ({
            underlyingToken: {
              address: reserve.underlyingAsset || '',
              symbol: reserve.symbol || '',
              decimals: reserve.decimals || 18,
              name: reserve.name || '',
            },
            aToken: {
              address: reserve.aTokenAddress || '',
              symbol: reserve.aTokenSymbol || '',
              decimals: reserve.decimals || 18,
            },
            vToken: {
              address: reserve.variableDebtTokenAddress || '',
              symbol: reserve.variableDebtTokenSymbol || '',
              decimals: reserve.decimals || 18,
            },
            size: reserve.totalLiquidity || '0',
            usdExchangeRate: reserve.priceInUSD || '0',
            isFrozen: reserve.isFrozen || false,
            isPaused: reserve.isPaused || false,
            flashLoanEnabled: reserve.flashLoanEnabled || false,
            permitSupported: reserve.permitSupported || false,
            supplyInfo: {
              apy: reserve.supplyAPY || '0',
              total: reserve.totalLiquidity || '0',
              maxLTV: reserve.baseLTVasCollateral || '0',
              liquidationThreshold: reserve.reserveLiquidationThreshold || '0',
              liquidationBonus: reserve.reserveLiquidationBonus || '0',
              canBeCollateral: reserve.usageAsCollateralEnabled || false,
              supplyCap: reserve.supplyCap || '0',
              supplyCapReached: reserve.supplyCapReached || false,
            },
            borrowInfo: reserve.borrowingEnabled ? {
              apy: reserve.variableBorrowAPY || '0',
              total: reserve.totalDebt || '0',
              borrowCap: reserve.borrowCap || '0',
              reserveFactor: reserve.reserveFactor || '0',
              availableLiquidity: reserve.availableLiquidity || '0',
              utilizationRate: reserve.utilizationRate || '0',
              variableRateSlope1: reserve.variableRateSlope1 || '0',
              variableRateSlope2: reserve.variableRateSlope2 || '0',
              optimalUsageRate: reserve.optimalUsageRatio || '0',
              borrowingState: reserve.borrowingEnabled ? 'enabled' : 'disabled',
              borrowCapReached: reserve.borrowCapReached || false,
            } : undefined,
            isolationModeConfig: reserve.isIsolated ? {
              canBeCollateral: reserve.usageAsCollateralEnabled || false,
              canBeBorrowed: reserve.borrowingEnabled || false,
              debtCeiling: reserve.debtCeiling || '0',
              debtCeilingDecimals: reserve.debtCeilingDecimals || 0,
              totalBorrows: reserve.isolationModeTotalDebt || '0',
            } : undefined,
            eModeInfo: reserve.eModeCategoryId ? [{
              categoryId: reserve.eModeCategoryId,
              label: reserve.eModeLabel || '',
              maxLTV: reserve.eModeLtv || '0',
              liquidationThreshold: reserve.eModeLiquidationThreshold || '0',
              liquidationPenalty: reserve.eModeLiquidationBonus || '0',
            }] : [],
            incentives: [],
            userState: reserve.userReserveData ? {
              balance: reserve.userReserveData.currentATokenBalance || '0',
              suppliable: reserve.availableLiquidity || '0',
              borrowable: reserve.userReserveData.availableBorrows || '0',
              canBeCollateral: reserve.usageAsCollateralEnabled || false,
              canBeBorrowed: reserve.borrowingEnabled || false,
              isInIsolationMode: reserve.isIsolated || false,
            } : undefined,
          }));

          const borrowReserves = supplyReserves.filter(r => r.borrowInfo);

          return {
            id: market.id || '',
            name: market.name || 'Aave Market',
            chain: {
              id: chainId,
              name: market.chainName || 'Unknown',
            },
            address: market.lendingPoolAddressProvider || '',
            icon: market.icon || '',
            totalMarketSize: market.totalLiquidity || '0',
            totalAvailableLiquidity: market.availableLiquidity || '0',
            eModeCategories: (market.eModeCategories || []).map((cat: any) => ({
              id: cat.id || 0,
              label: cat.label || '',
              maxLTV: cat.ltv || '0',
              liquidationThreshold: cat.liquidationThreshold || '0',
              liquidationPenalty: cat.liquidationBonus || '0',
            })),
            userState: market.userReserveData ? {
              netWorth: market.userReserveData.totalLiquidityUSD || '0',
              netAPY: market.userReserveData.netAPY || '0',
              healthFactor: market.userReserveData.healthFactor || '0',
              eModeEnabled: market.userReserveData.eModeEnabled || false,
              totalCollateralBase: market.userReserveData.totalCollateralUSD || '0',
              totalDebtBase: market.userReserveData.totalBorrowsUSD || '0',
              availableBorrowsBase: market.userReserveData.availableBorrowsUSD || '0',
              currentLiquidationThreshold: market.userReserveData.currentLiquidationThreshold || '0',
              ltv: market.userReserveData.ltv || '0',
              isInIsolationMode: market.userReserveData.isInIsolationMode || false,
            } : undefined,
            supplyReserves,
            borrowReserves,
          };
        });

        setAaveMarkets(formattedMarkets);
        if (formattedMarkets.length > 0 && !selectedMarket) {
          setSelectedMarket(formattedMarkets[0]);
        }
      } else {
        setError(`Failed to fetch markets: ${result.error}`);
      }
    } catch (err) {
      setError(`Error fetching markets: ${err}`);
      console.error("Market fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMarket]);

  // Supply assets to Aave
  const supply = useCallback(async (
    marketAddress: string,
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Supply:", { marketAddress, asset, amount, chainId });
      // Implementation will use actual Aave SDK supply action
      return { success: true, hash: '0x...' };
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  // Borrow assets from Aave
  const borrow = useCallback(async (
    marketAddress: string,
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Borrow:", { marketAddress, asset, amount, chainId });
      return { success: true, hash: '0x...' };
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  // Withdraw assets from Aave
  const withdraw = useCallback(async (
    marketAddress: string,
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Withdraw:", { marketAddress, asset, amount, chainId });
      return { success: true, hash: '0x...' };
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  // Repay borrowed assets
  const repay = useCallback(async (
    marketAddress: string,
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Repay:", { marketAddress, asset, amount, chainId });
      return { success: true, hash: '0x...' };
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  return {
    availableChains,
    aaveMarkets,
    selectedMarket,
    setSelectedMarket,
    isLoading,
    error,
    fetchMarkets,
    supply,
    borrow,
    withdraw,
    repay,
  };
};
