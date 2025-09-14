import { useMemo } from "react";
import { useWalletStore } from "@/state/walletStore";
import { Contract } from "ethers";
import type { Interface } from "ethers";

export function useContract(address: string | undefined, abi: any) {
  const { provider, signer } = useWalletStore();

  return useMemo(() => {
    if (!address || !abi || !provider) return null;
    // Prefer signer for write operations
    const runner = signer ?? provider;
    return new Contract(address, abi, runner);
  }, [address, abi, provider, signer]);
}