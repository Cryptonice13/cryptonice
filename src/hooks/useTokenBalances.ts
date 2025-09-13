import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { getProvider } from '@/lib/ethersProvider';
import { SUPPORTED_TOKENS } from '@/config/tokens';

interface TokenBalance {
  symbol: string;
  balance: string;
  address?: string;
  decimals: number;
}

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

export const useTokenBalances = () => {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address || !isConnected) {
      setBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const tokenBalances: TokenBalance[] = [];

      // Fetch ETH balance
      try {
        const ethBalance = await provider.getBalance(address);
        const ethBalanceFormatted = formatUnits(ethBalance, 18);
        
        if (parseFloat(ethBalanceFormatted) > 0) {
          tokenBalances.push({
            symbol: 'ETH',
            balance: parseFloat(ethBalanceFormatted).toFixed(4),
            decimals: 18,
          });
        }
      } catch (error) {
        console.error('Error fetching ETH balance:', error);
      }

      // Fetch ERC20 token balances (USDC, USDT - using USDT as DAI is not in config)
      const erc20Tokens = SUPPORTED_TOKENS.filter(token => 
        ['USDC', 'USDT'].includes(token.symbol) && token.address !== '0x0000000000000000000000000000000000000000'
      );

      for (const token of erc20Tokens) {
        try {
          // Create contract instance using ethers
          const contract = new (await import('ethers')).Contract(
            token.address,
            ERC20_ABI,
            provider
          );

          const balance = await contract.balanceOf(address);
          const balanceFormatted = formatUnits(balance, token.decimals);
          
          if (parseFloat(balanceFormatted) > 0) {
            tokenBalances.push({
              symbol: token.symbol,
              balance: parseFloat(balanceFormatted).toFixed(token.decimals === 6 ? 2 : 4),
              address: token.address,
              decimals: token.decimals,
            });
          }
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
        }
      }

      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setError('Failed to fetch token balances');
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
};