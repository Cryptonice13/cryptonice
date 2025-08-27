import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  setWalletData: (data: {
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
    balance: string;
  }) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      chainId: null,
      balance: '0',
      setWalletData: (data) => set(data),
      disconnect: () => set({
        isConnected: false,
        address: null,
        chainId: null,
        balance: '0',
      }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);