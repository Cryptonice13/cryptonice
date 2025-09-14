import React from 'react';
import { useWalletStore } from '@/state/walletStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export const WalletConnect = () => {
  const { address, isConnected, isConnecting, connect, disconnect } = useWalletStore();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      toast({
        title: "Connection Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#111] border border-green-500/20 hover:border-green-500/50 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connected
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your wallet is successfully connected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Address:</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </Badge>
                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <Button
              onClick={disconnect}
              variant="outline"
              className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              Disconnect Wallet
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card className="bg-[#111] border border-white/10 hover:border-green-500/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription className="text-gray-400">
            Choose your preferred wallet to connect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            variant="outline"
            className="w-full justify-start h-12 border-white/20 bg-white/5 hover:bg-green-500/10 hover:border-green-500/50 text-white transition-all duration-300"
          >
            <Wallet className="w-5 h-5 mr-3" />
            MetaMask
            {isConnecting && (
              <div className="ml-auto w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};