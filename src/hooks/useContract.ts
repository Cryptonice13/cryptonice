import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractConfig, CONTRACT_ADDRESSES } from '@/config/contracts';
import { useState } from 'react';

export const useContract = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const [lastTxHash, setLastTxHash] = useState<string>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: lastTxHash as `0x${string}`,
  });

  const readContract = (contractName: keyof typeof CONTRACT_ADDRESSES, functionName: string, args?: any[]) => {
    const config = getContractConfig(contractName);
    return useReadContract({
      address: config.address as `0x${string}`,
      abi: config.abi,
      functionName,
      args,
    });
  };

  const writeToContract = async (
    contractName: keyof typeof CONTRACT_ADDRESSES,
    functionName: string,
    args?: any[],
    value?: bigint
  ) => {
    const config = getContractConfig(contractName);
    
    const result = await writeContract({
      address: config.address as `0x${string}`,
      abi: config.abi,
      functionName,
      args,
      value,
    } as any);

    if (hash) {
      setLastTxHash(hash);
    }

    return hash;
  };

  return {
    readContract,
    writeToContract,
    isWritePending: isPending,
    isConfirming,
    isConfirmed,
    writeError: error,
    lastTxHash,
  };
};