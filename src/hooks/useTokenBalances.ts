import { useState, useEffect } from 'react';
import { useWalletStore } from '@/state/walletStore';
import { formatUnits, Contract } from 'ethers';
import { SUPPORTED_TOKENS } from '@/config/tokens';
import { CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';

export const useTokenBalances = () => {
  const { address, isConnected, provider } = useWalletStore();
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !provider) {
      setBalances({});
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const newBalances: Record<string, string> = {};

        // Get ETH balance
        const ethBalance = await provider.getBalance(address);
        newBalances['ETH'] = formatUnits(ethBalance, 18);

        // Get ERC20 balances
        const erc20Tokens = SUPPORTED_TOKENS.filter(token => token.symbol !== 'ETH');
        
        for (const token of erc20Tokens) {
          try {
            let tokenAddress = '';
            if (token.symbol === 'USDC') {
              tokenAddress = CONTRACT_ADDRESSES.USDC;
            } else if (token.symbol === 'USDT') {
              tokenAddress = CONTRACT_ADDRESSES.USDT;
            }

            if (tokenAddress) {
              const tokenContract = new Contract(tokenAddress, ABIS.ERC20, provider);
              const balance = await tokenContract.balanceOf(address);
              const decimals = await tokenContract.decimals();
              newBalances[token.symbol] = formatUnits(balance, decimals);
            }
          } catch (error) {
            console.error(`Failed to fetch ${token.symbol} balance:`, error);
            newBalances[token.symbol] = '0';
          }
        }

        setBalances(newBalances);
      } catch (error) {
        console.error('Failed to fetch token balances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [address, isConnected, provider]);

  // Filter tokens with balance > 0
  const nonZeroBalances = Object.entries(balances)
    .filter(([_, balance]) => parseFloat(balance) > 0)
    .map(([symbol, balance]) => ({
      symbol,
      balance,
      token: SUPPORTED_TOKENS.find(t => t.symbol === symbol)
    }))
    .filter(item => item.token);

  return {
    balances: nonZeroBalances,
    isLoading,
  };
};