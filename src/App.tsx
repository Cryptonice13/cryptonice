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
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Markets from "./pages/Markets";
import Alerts from "./pages/Alerts";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import StrategyBuilder from "./pages/StrategyBuilder";
import AIInsights from "./pages/AIInsights";

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
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/home" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/portfolio" element={
                  <ProtectedRoute>
                    <Portfolio />
                  </ProtectedRoute>
                } />
                <Route path="/markets" element={
                  <ProtectedRoute>
                    <Markets />
                  </ProtectedRoute>
                } />
                <Route path="/alerts" element={
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                } />
                <Route path="/strategy" element={
                  <ProtectedRoute>
                    <StrategyBuilder />
                  </ProtectedRoute>
                } />
                <Route path="/insights" element={
                  <ProtectedRoute>
                    <AIInsights />
                  </ProtectedRoute>
                } />
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
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
