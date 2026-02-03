import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CryptoAsset } from './useMarketData';

export interface WatchlistItem {
  id: string;
  asset_id: string;
  asset_symbol: string;
  asset_name: string;
  asset_logo: string | null;
  alert_price: number | null;
  alert_type: 'above' | 'below' | null;
  alert_triggered: boolean;
  created_at: string;
}

export interface AlertHistoryItem {
  id: string;
  asset_id: string;
  asset_symbol: string;
  alert_type: 'above' | 'below';
  target_price: number;
  triggered_price: number;
  triggered_at: string;
  is_read: boolean;
}

export function useWatchlistDb(walletAddress: string | undefined) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!walletAddress) {
      setWatchlist([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setWatchlist(data?.map(w => ({
        ...w,
        alert_price: w.alert_price ? Number(w.alert_price) : null,
        alert_type: w.alert_type as 'above' | 'below' | null,
      })) || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch alert history
  const fetchAlertHistory = useCallback(async () => {
    if (!walletAddress) {
      setAlertHistory([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('alert_history')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setAlertHistory(data?.map(a => ({
        ...a,
        target_price: Number(a.target_price),
        triggered_price: Number(a.triggered_price),
        alert_type: a.alert_type as 'above' | 'below',
      })) || []);
    } catch (error) {
      console.error('Error fetching alert history:', error);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchWatchlist();
    fetchAlertHistory();
  }, [fetchWatchlist, fetchAlertHistory]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (asset: CryptoAsset) => {
    if (!walletAddress) return false;

    // Check if already in watchlist
    if (watchlist.some(w => w.asset_id === asset.id)) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({
          wallet_address: walletAddress,
          asset_id: asset.id,
          asset_symbol: asset.symbol,
          asset_name: asset.name,
          asset_logo: asset.logo,
        });

      if (error) throw error;

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add to watchlist. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [walletAddress, watchlist, fetchWatchlist, toast]);

  // Remove from watchlist
  const removeFromWatchlist = useCallback(async (assetId: string) => {
    if (!walletAddress) return false;

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('asset_id', assetId);

      if (error) throw error;

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [walletAddress, fetchWatchlist, toast]);

  // Set price alert
  const setAlert = useCallback(async (
    assetId: string,
    price: number,
    type: 'above' | 'below'
  ) => {
    if (!walletAddress) return false;

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .update({
          alert_price: price,
          alert_type: type,
          alert_triggered: false,
        })
        .eq('wallet_address', walletAddress)
        .eq('asset_id', assetId);

      if (error) throw error;

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error setting alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to set alert. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [walletAddress, fetchWatchlist, toast]);

  // Clear alert
  const clearAlert = useCallback(async (assetId: string) => {
    if (!walletAddress) return false;

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .update({
          alert_price: null,
          alert_type: null,
          alert_triggered: false,
        })
        .eq('wallet_address', walletAddress)
        .eq('asset_id', assetId);

      if (error) throw error;

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error('Error clearing alert:', error);
      return false;
    }
  }, [walletAddress, fetchWatchlist]);

  // Check and trigger alerts based on current prices
  const checkAlerts = useCallback(async (currentPrices: Map<string, number>) => {
    if (!walletAddress) return;

    const triggeredAlerts: WatchlistItem[] = [];

    for (const item of watchlist) {
      if (!item.alert_price || !item.alert_type || item.alert_triggered) continue;

      const currentPrice = currentPrices.get(item.asset_id);
      if (!currentPrice) continue;

      const isTriggered =
        (item.alert_type === 'above' && currentPrice >= item.alert_price) ||
        (item.alert_type === 'below' && currentPrice <= item.alert_price);

      if (isTriggered) {
        triggeredAlerts.push(item);

        // Mark as triggered in watchlist
        await supabase
          .from('user_watchlist')
          .update({ alert_triggered: true })
          .eq('id', item.id);

        // Record in alert history
        await supabase
          .from('alert_history')
          .insert({
            wallet_address: walletAddress,
            asset_id: item.asset_id,
            asset_symbol: item.asset_symbol,
            alert_type: item.alert_type,
            target_price: item.alert_price,
            triggered_price: currentPrice,
          });
      }
    }

    if (triggeredAlerts.length > 0) {
      await fetchWatchlist();
      await fetchAlertHistory();

      // Show notification
      toast({
        title: `🔔 ${triggeredAlerts.length} Alert${triggeredAlerts.length > 1 ? 's' : ''} Triggered!`,
        description: triggeredAlerts.map(a => `${a.asset_symbol} ${a.alert_type} $${a.alert_price?.toLocaleString()}`).join(', '),
      });
    }

    return triggeredAlerts;
  }, [walletAddress, watchlist, fetchWatchlist, fetchAlertHistory, toast]);

  // Mark alert history as read
  const markAlertRead = useCallback(async (alertId: string) => {
    try {
      await supabase
        .from('alert_history')
        .update({ is_read: true })
        .eq('id', alertId);

      await fetchAlertHistory();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, [fetchAlertHistory]);

  // Check if asset is in watchlist
  const isInWatchlist = useCallback((assetId: string) => {
    return watchlist.some(w => w.asset_id === assetId);
  }, [watchlist]);

  // Get unread alert count
  const unreadAlertCount = alertHistory.filter(a => !a.is_read).length;

  return {
    watchlist,
    alertHistory,
    unreadAlertCount,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    setAlert,
    clearAlert,
    checkAlerts,
    markAlertRead,
    isInWatchlist,
    refresh: fetchWatchlist,
  };
}
