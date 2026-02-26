import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Bell, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface AlertSuggestion {
  asset_symbol: string;
  asset_id: string;
  suggestions: {
    type: 'above' | 'below';
    price: number;
    reasoning: string;
    confidence: number;
  }[];
}

interface SmartAlertSuggestionsProps {
  watchlist: {
    asset_id: string;
    asset_symbol: string;
    asset_name: string;
    asset_logo: string | null;
  }[];
  currentPrices: Map<string, number>;
  onApplyAlert: (assetId: string, price: number, type: 'above' | 'below') => Promise<void>;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;

export function SmartAlertSuggestions({ watchlist, currentPrices, onApplyAlert }: SmartAlertSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AlertSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async () => {
    if (watchlist.length === 0) return;
    setIsLoading(true);

    try {
      const context = watchlist.map(w => ({
        symbol: w.asset_symbol,
        asset_id: w.asset_id,
        currentPrice: currentPrices.get(w.asset_id) || 0,
      }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Suggest alerts for my watchlist' }],
          type: 'alert_suggestions',
          context,
        }),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          const parsed = JSON.parse(content);
          const suggestionsArray = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
          setSuggestions(suggestionsArray);
        } catch {
          setSuggestions([]);
        }
      }
    } catch (err) {
      console.error('Alert suggestions error:', err);
      toast({ title: 'Failed to get suggestions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [watchlist, currentPrices, toast]);

  const handleApply = async (assetId: string, price: number, type: 'above' | 'below') => {
    const key = `${assetId}-${price}-${type}`;
    setApplyingId(key);
    try {
      await onApplyAlert(assetId, price, type);
      toast({ title: 'Alert set!', description: `Alert set for ${type} $${price.toLocaleString()}` });
    } catch {
      toast({ title: 'Failed to set alert', variant: 'destructive' });
    } finally {
      setApplyingId(null);
    }
  };

  if (watchlist.length === 0) {
    return (
      <Card className="glass-card p-6 text-center">
        <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm font-medium">No watchlist items</p>
        <p className="text-xs text-muted-foreground mt-1">Add assets to your watchlist first to get AI alert suggestions.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.length === 0 && !isLoading && (
        <Card className="glass-card p-6 text-center">
          <Zap className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="font-semibold mb-1">AI Smart Alerts</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Get AI-powered alert suggestions based on support/resistance levels for your watchlist.
          </p>
          <Button onClick={fetchSuggestions} className="button-gradient" disabled={isLoading}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Suggestions
          </Button>
        </Card>
      )}

      {isLoading && (
        <Card className="glass-card p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Analyzing support & resistance levels...</p>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {suggestions.length} asset{suggestions.length !== 1 ? 's' : ''} analyzed
            </p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchSuggestions} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
              Refresh
            </Button>
          </div>

          {suggestions.map((asset, i) => {
            const watchlistItem = watchlist.find(w => w.asset_symbol === asset.asset_symbol);
            const currentPrice = currentPrices.get(asset.asset_id || watchlistItem?.asset_id || '') || 0;

            return (
              <motion.div
                key={asset.asset_symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {watchlistItem?.asset_logo && (
                        <img src={watchlistItem.asset_logo} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">{asset.asset_symbol}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Current: ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {asset.suggestions?.map((s, j) => {
                    const key = `${asset.asset_id}-${s.price}-${s.type}`;
                    return (
                      <div key={j} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            s.type === 'above' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {s.type === 'above' ? (
                              <TrendingUp className="w-3 h-3 text-green-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium">
                              {s.type === 'above' ? 'Above' : 'Below'} ${s.price.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.reasoning}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs ml-2 flex-shrink-0"
                          onClick={() => handleApply(asset.asset_id || watchlistItem?.asset_id || '', s.price, s.type)}
                          disabled={applyingId === key}
                        >
                          {applyingId === key ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Bell className="w-3 h-3 mr-1" />
                              Apply
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
