import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Chat from "./pages/Chat";
import Analysis from "./pages/Analysis";
import Credits from "./pages/Credits";
import FloatingChatButton from "./components/FloatingChatButton";
import InstallPrompt from "./components/InstallPrompt";
import ResetPassword from "./pages/ResetPassword";
import Community from "./pages/Community";
import Safety from "./pages/Safety";
import Realtime from "./pages/Realtime";
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
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
                <Route path="/home" element={<Navigate to="/chat" replace />} />
                <Route path="/portfolio" element={<Navigate to="/chat" replace />} />
                <Route path="/safety" element={<Navigate to="/chat?tab=markets" replace />} />
                <Route path="/markets" element={<Navigate to="/chat?tab=markets" replace />} />
                <Route path="/realtime" element={
                  <ProtectedRoute>
                    <Realtime />
                  </ProtectedRoute>
                } />
                <Route path="/strategy" element={<Navigate to="/chat?tab=strategy" replace />} />
                <Route path="/alerts" element={
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                } />
                
                <Route path="/insights" element={
                  <ProtectedRoute>
                    <AIInsights />
                  </ProtectedRoute>
                } />
                <Route path="/analysis/:assetId" element={
                  <ProtectedRoute>
                    <Analysis />
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
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
                <Route path="/credits" element={
                  <ProtectedRoute>
                    <Credits />
                  </ProtectedRoute>
                } />
                <Route path="/community" element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                } />
                
              </Routes>
              <FloatingChatButton />
              <InstallPrompt />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
