import { useContract } from './useContract';
import { useWalletStore } from '@/state/walletStore';
import { useCallback } from 'react';
import { parseUnits, formatUnits, Contract } from 'ethers';
import { useToast } from './use-toast';
import { CONTRACTS, CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';

export const useLendingPool = () => {
  const pool = useContract(CONTRACTS.lendingPool.address, CONTRACTS.lendingPool.abi);
  const { signer, address, isConnected } = useWalletStore();
  const { toast } = useToast();

  async function approveERC20(tokenAddress: string, spender: string, amount: string, decimals = 18) {
    if (!signer) throw new Error("Signer not available");
    const token = new Contract(tokenAddress, ABIS.ERC20, signer);
    const amt = parseUnits(amount, decimals);
    const tx = await token.approve(spender, amt);
    await tx.wait();
  }

  const getUserAccountData = useCallback(async () => {
    if (!pool || !address) {
      return {
        totalCollateral: '0',
        totalDebt: '0', 
        healthFactor: '0',
        availableBorrows: '0',
        liquidationThreshold: '80',
        ltv: '0'
      };
    }

    try {
      const allAssets = [
        "0x0000000000000000000000000000000000000000", // ETH
        CONTRACT_ADDRESSES.USDC,
        CONTRACT_ADDRESSES.USDT
      ];
      
      const [totalCollateralE18, totalDebtE18, healthFactorE18] = await pool.getUserAccountData(address, allAssets);
      
      return {
        totalCollateral: formatUnits(totalCollateralE18, 18),
        totalDebt: formatUnits(totalDebtE18, 18),
        healthFactor: formatUnits(healthFactorE18, 18),
        availableBorrows: '0', // Calculate based on collateral and LTV
        liquidationThreshold: '80',
        ltv: totalCollateralE18 > 0n ? formatUnits((totalDebtE18 * 10000n) / totalCollateralE18, 2) : '0'
      };
    } catch (error) {
      console.error('Failed to get user account data:', error);
      return {
        totalCollateral: '0',
        totalDebt: '0', 
        healthFactor: '0',
        availableBorrows: '0',
        liquidationThreshold: '80',
        ltv: '0'
      };
    }
  }, [pool, address]);

  const deposit = useCallback(async (tokenAddress: string, amount: string, decimals = 18) => {
    if (!isConnected || !address || !pool || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to deposit",
        variant: "destructive",
      });
      return;
    }

    try {
      const asset = tokenAddress === "ETH" ? "0x0000000000000000000000000000000000000000" : tokenAddress;
      const amt = parseUnits(amount, decimals);

      // For ERC20 tokens, ensure approval first
      if (tokenAddress !== "ETH") {
        await approveERC20(tokenAddress, CONTRACTS.lendingPool.address, amount, decimals);
      }

      // Call deposit with value for ETH
      const tx = tokenAddress === "ETH" 
        ? await pool.deposit(asset, amt, { value: amt })
        : await pool.deposit(asset, amt);

      const receipt = await tx.wait();

      toast({
        title: "Deposit successful",
        description: `Successfully deposited ${amount} ${tokenAddress === "ETH" ? "ETH" : "tokens"}`,
      });

      return receipt;
    } catch (error) {
      console.error('Deposit failed:', error);
      toast({
        title: "Deposit failed",
        description: "Failed to submit deposit transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [pool, address, isConnected, signer, toast]);

  const borrow = useCallback(async (asset: string, amount: string, decimals = 18) => {
    if (!isConnected || !address || !pool) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to borrow",
        variant: "destructive",
      });
      return;
    }

    try {
      const amt = parseUnits(amount, decimals);
      const allAssets = [
        "0x0000000000000000000000000000000000000000", // ETH
        CONTRACT_ADDRESSES.USDC,
        CONTRACT_ADDRESSES.USDT
      ];

      const tx = await pool.borrow(asset, amt, allAssets);
      const receipt = await tx.wait();

      toast({
        title: "Borrow successful",
        description: `Successfully borrowed ${amount} tokens`,
      });

      return receipt;
    } catch (error) {
      console.error('Borrow failed:', error);
      toast({
        title: "Borrow failed",
        description: "Failed to submit borrow transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [pool, address, isConnected, toast]);

  const repay = useCallback(async (asset: string, amount: string, decimals = 18, onBehalfOf?: string) => {
    if (!isConnected || !address || !pool || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to repay",
        variant: "destructive",
      });
      return;
    }

    try {
      if (asset !== "0x0000000000000000000000000000000000000000") {
        await approveERC20(asset, CONTRACTS.lendingPool.address, amount, decimals);
      }
      
      const amt = parseUnits(amount, decimals);
      const target = onBehalfOf ?? address;
      
      const tx = asset === "0x0000000000000000000000000000000000000000"
        ? await pool.repay(asset, amt, target, { value: amt })
        : await pool.repay(asset, amt, target);
        
      const receipt = await tx.wait();

      toast({
        title: "Repayment successful",
        description: `Successfully repaid ${amount} tokens`,
      });

      return receipt;
    } catch (error) {
      console.error('Repay failed:', error);
      toast({
        title: "Repayment failed",
        description: "Failed to submit repayment transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [pool, address, isConnected, signer, toast]);

  const withdraw = useCallback(async (asset: string, shares: string, decimals = 18) => {
    if (!isConnected || !address || !pool) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to withdraw",
        variant: "destructive",
      });
      return;
    }

    try {
      const s = parseUnits(shares, decimals);
      const tx = await pool.withdraw(asset, s);
      const receipt = await tx.wait();

      toast({
        title: "Withdrawal successful",
        description: `Successfully withdrew ${shares} tokens`,
      });

      return receipt;
    } catch (error) {
      console.error('Withdraw failed:', error);
      toast({
        title: "Withdrawal failed",
        description: "Failed to submit withdrawal transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [pool, address, isConnected, toast]);

  return { 
    pool, 
    deposit, 
    borrow, 
    repay, 
    withdraw, 
    getUserAccountData,
    isTransactionPending: false, // Add for modal compatibility
    isTransactionConfirming: false,
    isTransactionConfirmed: false,
  };
};