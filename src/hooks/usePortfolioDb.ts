import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CryptoAsset } from './useMarketData';

export interface PortfolioPosition {
  id: string;
  asset_id: string;
  asset_symbol: string;
  asset_name: string;
  asset_logo: string | null;
  amount: number;
  avg_buy_price: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTransaction {
  id: string;
  asset_id: string;
  asset_symbol: string;
  transaction_type: 'buy' | 'sell';
  amount: number;
  price_per_unit: number;
  total_value: number;
  notes: string | null;
  created_at: string;
}

export function usePortfolioDb(walletAddress: string | undefined) {
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch portfolio positions
  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) {
      setPortfolio([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_portfolio')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPortfolio(data?.map(p => ({
        ...p,
        amount: Number(p.amount),
        avg_buy_price: Number(p.avg_buy_price),
      })) || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setTransactions(data?.map(t => ({
        ...t,
        amount: Number(t.amount),
        price_per_unit: Number(t.price_per_unit),
        total_value: Number(t.total_value),
        transaction_type: t.transaction_type as 'buy' | 'sell',
      })) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPortfolio();
    fetchTransactions();
  }, [fetchPortfolio, fetchTransactions]);

  // Add or update a position
  const addPosition = useCallback(async (
    asset: CryptoAsset,
    amount: number,
    buyPrice: number
  ) => {
    if (!walletAddress) return false;

    try {
      // Check if position exists
      const existing = portfolio.find(p => p.asset_id === asset.id);

      if (existing) {
        // Update existing position with weighted average
        const newAmount = existing.amount + amount;
        const newAvgPrice = (existing.avg_buy_price * existing.amount + buyPrice * amount) / newAmount;

        const { error } = await supabase
          .from('user_portfolio')
          .update({
            amount: newAmount,
            avg_buy_price: newAvgPrice,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new position
        const { error } = await supabase
          .from('user_portfolio')
          .insert({
            wallet_address: walletAddress,
            asset_id: asset.id,
            asset_symbol: asset.symbol,
            asset_name: asset.name,
            asset_logo: asset.logo,
            amount,
            avg_buy_price: buyPrice,
          });

        if (error) throw error;
      }

      // Record transaction
      await supabase
        .from('portfolio_transactions')
        .insert({
          wallet_address: walletAddress,
          asset_id: asset.id,
          asset_symbol: asset.symbol,
          transaction_type: 'buy',
          amount,
          price_per_unit: buyPrice,
          total_value: amount * buyPrice,
        });

      await fetchPortfolio();
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error adding position:', error);
      toast({
        title: 'Error',
        description: 'Failed to add position. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [walletAddress, portfolio, fetchPortfolio, fetchTransactions, toast]);

  // Sell/reduce a position
  const sellPosition = useCallback(async (
    assetId: string,
    amount: number,
    sellPrice: number
  ) => {
    if (!walletAddress) return false;

    try {
      const existing = portfolio.find(p => p.asset_id === assetId);
      if (!existing) return false;

      const newAmount = existing.amount - amount;

      if (newAmount <= 0) {
        // Remove position entirely
        const { error } = await supabase
          .from('user_portfolio')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Update with reduced amount
        const { error } = await supabase
          .from('user_portfolio')
          .update({ amount: newAmount })
          .eq('id', existing.id);

        if (error) throw error;
      }

      // Record sell transaction
      await supabase
        .from('portfolio_transactions')
        .insert({
          wallet_address: walletAddress,
          asset_id: assetId,
          asset_symbol: existing.asset_symbol,
          transaction_type: 'sell',
          amount,
          price_per_unit: sellPrice,
          total_value: amount * sellPrice,
        });

      await fetchPortfolio();
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error selling position:', error);
      toast({
        title: 'Error',
        description: 'Failed to sell position. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [walletAddress, portfolio, fetchPortfolio, fetchTransactions, toast]);

  // Remove a position completely
  const removePosition = useCallback(async (assetId: string) => {
    if (!walletAddress) return false;

    try {
      const { error } = await supabase
        .from('user_portfolio')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('asset_id', assetId);

      if (error) throw error;

      await fetchPortfolio();
      return true;
    } catch (error) {
      console.error('Error removing position:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove position. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [walletAddress, fetchPortfolio, toast]);

  // Calculate totals
  const getTotalValue = useCallback((currentPrices: Map<string, number>) => {
    return portfolio.reduce((total, p) => {
      const currentPrice = currentPrices.get(p.asset_id) || 0;
      return total + p.amount * currentPrice;
    }, 0);
  }, [portfolio]);

  const getTotalPnL = useCallback((currentPrices: Map<string, number>) => {
    return portfolio.reduce((total, p) => {
      const currentPrice = currentPrices.get(p.asset_id) || 0;
      const currentValue = p.amount * currentPrice;
      const costBasis = p.amount * p.avg_buy_price;
      return total + (currentValue - costBasis);
    }, 0);
  }, [portfolio]);

  return {
    portfolio,
    transactions,
    isLoading,
    addPosition,
    sellPosition,
    removePosition,
    getTotalValue,
    getTotalPnL,
    refresh: fetchPortfolio,
  };
}
