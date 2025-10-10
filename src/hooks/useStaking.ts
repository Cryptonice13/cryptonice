import { useState, useEffect, useCallback } from 'react';
import { Contract, parseEther, formatEther } from 'ethers';
import { useWalletStore } from '@/state/walletStore';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import StakingPoolABI from '@/contracts/abis/StakingPool.json';
import ERC20ABI from '@/contracts/abis/MockERC20.json';
import { toast } from '@/hooks/use-toast';

export interface StakingInfo {
  stakedBalance: string;
  earnedRewards: string;
  totalPoolStaked: string;
  apy: string;
}

export const useStaking = () => {
  const { provider, signer, address } = useWalletStore();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    stakedBalance: '0',
    earnedRewards: '0',
    totalPoolStaked: '0',
    apy: '0',
  });
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const getStakingPoolContract = useCallback(() => {
    if (!provider) return null;
    const runner = signer ?? provider;
    return new Contract(CONTRACT_ADDRESSES.STAKING_POOL, StakingPoolABI, runner);
  }, [provider, signer]);

  const getStakingTokenContract = useCallback(() => {
    if (!provider) return null;
    const runner = signer ?? provider;
    return new Contract(CONTRACT_ADDRESSES.STAKING_TOKEN, ERC20ABI, runner);
  }, [provider, signer]);

  const fetchStakingInfo = useCallback(async () => {
    const contract = getStakingPoolContract();
    if (!contract || !address) return;

    try {
      const info = await contract.getStakingInfo(address);
      
      setStakingInfo({
        stakedBalance: formatEther(info.staked),
        earnedRewards: formatEther(info.earnedRewards),
        totalPoolStaked: formatEther(info.totalPoolStaked),
        apy: (Number(info.apy) / 100).toFixed(2),
      });
    } catch (error) {
      console.error('Error fetching staking info:', error);
    }
  }, [getStakingPoolContract, address]);

  const fetchTokenBalance = useCallback(async () => {
    const tokenContract = getStakingTokenContract();
    if (!tokenContract || !address) return;

    try {
      const balance = await tokenContract.balanceOf(address);
      setTokenBalance(formatEther(balance));
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  }, [getStakingTokenContract, address]);

  const stake = async (amount: string) => {
    const contract = getStakingPoolContract();
    const tokenContract = getStakingTokenContract();
    if (!contract || !tokenContract || !signer) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const amountInWei = parseEther(amount);

      // Approve tokens
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.STAKING_POOL, amountInWei);
      await approveTx.wait();

      // Stake
      const stakeTx = await contract.stake(amountInWei);
      await stakeTx.wait();

      toast({
        title: "Success",
        description: `Staked ${amount} CRDX tokens`,
      });

      await fetchStakingInfo();
      await fetchTokenBalance();
    } catch (error: any) {
      console.error('Error staking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to stake tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unstake = async (amount: string) => {
    const contract = getStakingPoolContract();
    if (!contract || !signer) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const amountInWei = parseEther(amount);

      const tx = await contract.unstake(amountInWei);
      await tx.wait();

      toast({
        title: "Success",
        description: `Unstaked ${amount} CRDX tokens`,
      });

      await fetchStakingInfo();
      await fetchTokenBalance();
    } catch (error: any) {
      console.error('Error unstaking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unstake tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async () => {
    const contract = getStakingPoolContract();
    if (!contract || !signer) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const tx = await contract.claimReward();
      await tx.wait();

      toast({
        title: "Success",
        description: "Rewards claimed successfully",
      });

      await fetchStakingInfo();
      await fetchTokenBalance();
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim rewards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mintTokens = async (amount: string) => {
    const tokenContract = getStakingTokenContract();
    if (!tokenContract || !signer || !address) return;

    try {
      const amountInWei = parseEther(amount);
      const tx = await tokenContract.faucet(address, amountInWei);
      await tx.wait();

      toast({
        title: "Success",
        description: `Minted ${amount} CRDX tokens`,
      });

      await fetchTokenBalance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mint tokens",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (provider && address) {
      fetchStakingInfo();
      fetchTokenBalance();

      // Refresh data every 10 seconds
      const interval = setInterval(() => {
        fetchStakingInfo();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [provider, address, fetchStakingInfo, fetchTokenBalance]);

  return {
    stakingInfo,
    tokenBalance,
    isLoading,
    stake,
    unstake,
    claimReward,
    mintTokens,
    refreshStakingInfo: fetchStakingInfo,
  };
};
