import { create } from 'zustand';
import { BrowserProvider, JsonRpcProvider, type Signer } from 'ethers';

type WalletState = {
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: Signer | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  setProvider: (p: any) => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,

  setProvider: (p) => set({ provider: p }),

  connect: async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // If on mobile and MetaMask is not injected, open MetaMask app via deep link
    if (isMobile && !window.ethereum) {
      const currentUrl = encodeURIComponent(window.location.href);
      const metamaskAppDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
      window.location.href = metamaskAppDeepLink;
      throw new Error("Opening MetaMask app...");
    }
    
    if (!window.ethereum) {
      throw new Error("No wallet found. Please install MetaMask or use a Web3 browser.");
    }
    
    set({ isConnecting: true });
    
    try {
      // Request accounts first (triggers MetaMask popup/connection)
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
      
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      set({ 
        provider, 
        signer, 
        address, 
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false
      });

      // Listen for account changes
      (window.ethereum as any).on?.("accountsChanged", async (accounts: string[]) => {
        if (accounts.length === 0) {
          get().disconnect();
        } else {
          try {
            const s = await provider.getSigner();
            const addr = await s.getAddress();
            set({ signer: s, address: addr });
          } catch (error) {
            console.error("Error updating account:", error);
          }
        }
      });

      // Listen for chain changes
      (window.ethereum as any).on?.("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      set({ isConnecting: false });
      throw error;
    }
  },

  disconnect: () => {
    set({ 
      provider: null, 
      signer: null, 
      address: null, 
      chainId: null,
      isConnected: false,
      isConnecting: false
    });
  }
}));