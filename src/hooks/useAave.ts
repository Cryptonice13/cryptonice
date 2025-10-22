import { useState, useEffect, useCallback } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { aaveClient } from '@/lib/aaveClient';
import { chains, markets } from '@aave/client/actions';
import { sendWith } from '@aave/client/viem';
import type { EvmAddress, ChainId } from '@aave/client';

export interface AaveMarket {
  id: string;
  name: string;
  totalSupply: string;
  totalBorrow: string;
  supplyApy: string;
  borrowApy: string;
}

export interface UserReserve {
  underlyingAsset: string;
  symbol: string;
  scaledATokenBalance: string;
  currentATokenBalance: string;
  currentVariableDebt: string;
  supplyApy: string;
  borrowApy: string;
}

export const useAave = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [availableChains, setAvailableChains] = useState<any[]>([]);
  const [aaveMarkets, setAaveMarkets] = useState<AaveMarket[]>([]);
  const [userPositions, setUserPositions] = useState<UserReserve[]>([]);
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

  // Fetch markets for a specific chain
  const fetchMarkets = useCallback(async (chainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await markets(aaveClient, {
        chainIds: [chainId as ChainId],
      });

      if (result.isOk()) {
        const formattedMarkets: AaveMarket[] = result.value.map((market: any) => ({
          id: market.id,
          name: market.name || 'Unknown',
          totalSupply: market.totalLiquidity || '0',
          totalBorrow: market.totalDebt || '0',
          supplyApy: market.supplyApy || '0',
          borrowApy: market.borrowApy || '0',
        }));
        setAaveMarkets(formattedMarkets);
      } else {
        setError(`Failed to fetch markets: ${result.error}`);
      }
    } catch (err) {
      setError(`Error fetching markets: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user positions
  const fetchUserPositions = useCallback(async (chainId: number) => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Note: userReserves action to be implemented when available in SDK
      // For now, this is a placeholder
      setUserPositions([]);
      console.log("User positions fetch would happen here for chain:", chainId, "user:", address);
    } catch (err) {
      setError(`Error fetching user positions: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Supply assets to Aave
  const supply = useCallback(async (
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    // Note: You'll need to import the actual supply action from @aave/client/actions
    // This is a placeholder showing the pattern
    try {
      // const result = await supply(aaveClient, {
      //   chainId: chainId as aaveChainId,
      //   asset,
      //   amount,
      //   onBehalfOf: address as evmAddress,
      // })
      //   .andThen(sendWith(walletClient))
      //   .andThen(aaveClient.waitForTransaction);

      // if (result.isErr()) {
      //   throw new Error(result.error.message);
      // }
      
      // return result.value;
      console.log("Supply action would be called here");
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  // Borrow assets from Aave
  const borrow = useCallback(async (
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    // Note: You'll need to import the actual borrow action from @aave/client/actions
    // This is a placeholder showing the pattern
    try {
      console.log("Borrow action would be called here");
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  // Withdraw assets from Aave
  const withdraw = useCallback(async (
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Withdraw action would be called here");
    } catch (err) {
      throw err;
    }
  }, [walletClient, address]);

  // Repay borrowed assets
  const repay = useCallback(async (
    asset: EvmAddress,
    amount: bigint,
    chainId: number
  ) => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Repay action would be called here");
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
    userPositions,
    isLoading,
    error,
    fetchMarkets,
    fetchUserPositions,
    supply,
    borrow,
    withdraw,
    repay,
  };
};
