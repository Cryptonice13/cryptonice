import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useCallback } from 'react';

export const useWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const connectWallet = useCallback(async (connectorId?: string) => {
    const connector = connectorId 
      ? connectors.find(c => c.id === connectorId) || connectors[0]
      : connectors[0];
    
    if (connector) {
      connect({ connector });
    }
  }, [connect, connectors]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isPending,
    balance,
    connectWallet,
    disconnectWallet,
    connectors,
  };
};