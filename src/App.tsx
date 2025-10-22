import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { useEffect } from 'react';
import { useWalletStore } from '@/state/walletStore';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import LoanApplication from "./pages/LoanApplication";
import MyLoans from "./pages/MyLoans";
import LoanHistory from "./pages/LoanHistory";
import NFTMarketplace from "./pages/NFTMarketplace";
import Finance from "./pages/Finance";

const queryClient = new QueryClient();

const WalletInitializer = () => {
  const initialize = useWalletStore(state => state.initialize);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return null;
};

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Sonner />
            <WalletInitializer />
            <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/apply-loan" element={
            <ProtectedRoute>
              <LoanApplication />
            </ProtectedRoute>
          } />
          <Route path="/my-loans" element={
            <ProtectedRoute>
              <MyLoans />
            </ProtectedRoute>
          } />
          <Route path="/loan-history" element={
            <ProtectedRoute>
              <LoanHistory />
            </ProtectedRoute>
          } />
          <Route path="/nft-marketplace" element={
            <ProtectedRoute>
              <NFTMarketplace />
            </ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute>
              <Finance />
            </ProtectedRoute>
          } />
          <Route path="/aave-dashboard" element={
            <ProtectedRoute>
              <AaveDashboard />
            </ProtectedRoute>
          } />
        </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;