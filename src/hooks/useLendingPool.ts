import { useContract } from './useContract';
import { useWallet } from './useWallet';
import { useCallback } from 'react';
import { parseEther, formatEther } from 'viem';
import { useToast } from './use-toast';

export const useLendingPool = () => {
  const { writeToContract, isWritePending, isConfirming, isConfirmed } = useContract();
  const { address, isConnected } = useWallet();
  const { toast } = useToast();

  const getUserAccountData = useCallback(async () => {
    // Mock data for now since we don't have actual contracts deployed
    return {
      totalCollateral: '0',
      totalDebt: '0', 
      healthFactor: '1.0',
      availableBorrows: '0',
      liquidationThreshold: '80',
      ltv: '0'
    };
  }, []);

  const deposit = useCallback(async (assetAddress: string, amount: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to deposit",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const hash = await writeToContract('LENDING_POOL', 'deposit', [
        assetAddress,
        amountWei,
        address,
        0, // referralCode
      ]);

      toast({
        title: "Deposit initiated",
        description: "Your deposit transaction has been submitted",
      });

      return hash;
    } catch (error) {
      console.error('Deposit failed:', error);
      toast({
        title: "Deposit failed",
        description: "Failed to submit deposit transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [writeToContract, address, isConnected, toast]);

  const borrow = useCallback(async (assetAddress: string, amount: string, interestRateMode: number = 2) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to borrow",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const hash = await writeToContract('LENDING_POOL', 'borrow', [
        assetAddress,
        amountWei,
        interestRateMode,
        0, // referralCode
        address,
      ]);

      toast({
        title: "Borrow initiated",
        description: "Your borrow transaction has been submitted",
      });

      return hash;
    } catch (error) {
      console.error('Borrow failed:', error);
      toast({
        title: "Borrow failed",
        description: "Failed to submit borrow transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [writeToContract, address, isConnected, toast]);

  const repay = useCallback(async (assetAddress: string, amount: string, rateMode: number = 2) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to repay",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const hash = await writeToContract('LENDING_POOL', 'repay', [
        assetAddress,
        amountWei,
        rateMode,
        address,
      ]);

      toast({
        title: "Repayment initiated",
        description: "Your repayment transaction has been submitted",
      });

      return hash;
    } catch (error) {
      console.error('Repay failed:', error);
      toast({
        title: "Repayment failed",
        description: "Failed to submit repayment transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [writeToContract, address, isConnected, toast]);

  const withdraw = useCallback(async (assetAddress: string, amount: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to withdraw",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const hash = await writeToContract('LENDING_POOL', 'withdraw', [
        assetAddress,
        amountWei,
        address,
      ]);

      toast({
        title: "Withdrawal initiated",
        description: "Your withdrawal transaction has been submitted",
      });

      return hash;
    } catch (error) {
      console.error('Withdraw failed:', error);
      toast({
        title: "Withdrawal failed",
        description: "Failed to submit withdrawal transaction",
        variant: "destructive",
      });
      throw error;
    }
  }, [writeToContract, address, isConnected, toast]);

  return {
    deposit,
    borrow,
    repay,
    withdraw,
    getUserAccountData,
    isTransactionPending: isWritePending,
    isTransactionConfirming: isConfirming,
    isTransactionConfirmed: isConfirmed,
  };
};