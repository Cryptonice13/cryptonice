import { JsonRpcProvider, BrowserProvider } from 'ethers';
import { getRPCUrl } from '@/config/env';

export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }
  return new JsonRpcProvider(getRPCUrl());
};

export const getSigner = async () => {
  const provider = getProvider();
  if (provider instanceof BrowserProvider) {
    return await provider.getSigner();
  }
  throw new Error('No wallet connected');
};