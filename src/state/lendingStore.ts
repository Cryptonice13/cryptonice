import { create } from 'zustand';
import { Token } from '@/config/tokens';

interface UserPosition {
  token: Token;
  supplied: string;
  borrowed: string;
  aTokenBalance: string;
  debtTokenBalance: string;
}

interface LendingState {
  userPositions: UserPosition[];
  totalCollateral: string;
  totalDebt: string;
  healthFactor: string;
  availableBorrows: string;
  liquidationThreshold: string;
  ltv: string;
  isLoading: boolean;
  error: string | null;
  
  setUserPositions: (positions: UserPosition[]) => void;
  setAccountData: (data: {
    totalCollateral: string;
    totalDebt: string;
    healthFactor: string;
    availableBorrows: string;
    liquidationThreshold: string;
    ltv: string;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLendingStore = create<LendingState>((set) => ({
  userPositions: [],
  totalCollateral: '0',
  totalDebt: '0',
  healthFactor: '0',
  availableBorrows: '0',
  liquidationThreshold: '0',
  ltv: '0',
  isLoading: false,
  error: null,

  setUserPositions: (positions) => set({ userPositions: positions }),
  
  setAccountData: (data) => set(data),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    userPositions: [],
    totalCollateral: '0',
    totalDebt: '0',
    healthFactor: '0',
    availableBorrows: '0',
    liquidationThreshold: '0',
    ltv: '0',
    isLoading: false,
    error: null,
  }),
}));