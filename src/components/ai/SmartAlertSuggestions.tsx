import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Sparkles, Bell, TrendingUp, TrendingDown, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { invokeCryptoAI, readCryptoAIError } from '@/lib/cryptoAIClient';

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

interface SavedSuggestion {
  id: string;
  asset_id: string;
  asset_symbol: string;
  suggestion_type: string;
  target_price: number;
  reasoning: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-ai`;

export function SmartAlertSuggestions({ watchlist, currentPrices, onApplyAlert }: SmartAlertSuggestionsProps) {
  const [savedSuggestions, setSavedSuggestions] = useState<SavedSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { address } = useAccount();

  // Load saved suggestions from DB
  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('ai_alert_suggestions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setSavedSuggestions((data as unknown as SavedSuggestion[]) || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user || address) loadSuggestions();
  }, [user, address, loadSuggestions]);

  const generateAndSave = useCallback(async () => {
    if (watchlist.length === 0) return;
    setIsGenerating(true);

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
          // Strip markdown code fences if present
          const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
          const parsed = JSON.parse(cleaned);
          const suggestionsArray = Array.isArray(parsed) ? parsed : parsed.suggestions || [];

          // Save each suggestion to DB
          const inserts = suggestionsArray.flatMap((asset: any) =>
            (asset.suggestions || []).map((s: any) => ({
              user_id: user?.id || null,
              wallet_address: address || null,
              asset_id: asset.asset_id || watchlist.find(w => w.asset_symbol === asset.asset_symbol)?.asset_id || '',
              asset_symbol: asset.asset_symbol,
              suggestion_type: s.type,
              target_price: s.price,
              reasoning: s.reasoning || null,
              confidence: s.confidence || 0,
              status: 'active',
            }))
          );

          if (inserts.length > 0) {
            await supabase.from('ai_alert_suggestions' as any).insert(inserts);
          }

          await loadSuggestions();
          toast({ title: `${inserts.length} AI suggestions saved` });
        } catch {
          toast({ title: 'Failed to parse suggestions', variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error('Alert suggestions error:', err);
      toast({ title: 'Failed to generate suggestions', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [watchlist, currentPrices, toast, user, address, loadSuggestions]);

  const handleApply = async (suggestion: SavedSuggestion) => {
    setApplyingId(suggestion.id);
    try {
      await onApplyAlert(suggestion.asset_id, suggestion.target_price, suggestion.suggestion_type as 'above' | 'below');
      await supabase
        .from('ai_alert_suggestions' as any)
        .update({ status: 'applied' })
        .eq('id', suggestion.id);
      setSavedSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: 'applied' } : s));
      toast({ title: 'Alert applied!' });
    } catch {
      toast({ title: 'Failed to apply alert', variant: 'destructive' });
    } finally {
      setApplyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('ai_alert_suggestions' as any).delete().eq('id', id);
    setSavedSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (watchlist.length === 0) {
    return (
      <Card className="p-4 text-center border-dashed">
        <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-40" />
        <p className="text-sm text-muted-foreground">Add assets to your watchlist first.</p>
      </Card>
    );
  }

  const activeSuggestions = savedSuggestions.filter(s => s.status === 'active');
  const appliedSuggestions = savedSuggestions.filter(s => s.status === 'applied');

  return (
    <div className="space-y-3">
      {/* Generate Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {savedSuggestions.length > 0 ? `${activeSuggestions.length} active · ${appliedSuggestions.length} applied` : 'No suggestions yet'}
        </div>
        <Button
          size="sm"
          className="h-8 text-xs button-gradient"
          onClick={generateAndSave}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
          {savedSuggestions.length > 0 ? 'Generate More' : 'Generate Suggestions'}
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-4 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </Card>
      ) : savedSuggestions.length === 0 && !isGenerating ? (
        <Card className="p-6 text-center border-dashed">
          <Bell className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-medium">AI Smart Alerts</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate AI-powered alert suggestions based on support/resistance levels.
          </p>
        </Card>
      ) : (
        <>
          {/* Active Suggestions Table */}
          {activeSuggestions.length > 0 && (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-[10px] uppercase tracking-wider">Asset</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wider">Type</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wider">Target</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wider hidden sm:table-cell">Reason</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSuggestions.map(s => (
                    <TableRow key={s.id} className="group">
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          {watchlist.find(w => w.asset_id === s.asset_id)?.asset_logo && (
                            <img
                              src={watchlist.find(w => w.asset_id === s.asset_id)!.asset_logo!}
                              alt=""
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="font-semibold text-xs">{s.asset_symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 gap-0.5 ${
                            s.suggestion_type === 'above'
                              ? 'border-green-500/40 text-green-400'
                              : 'border-red-500/40 text-red-400'
                          }`}
                        >
                          {s.suggestion_type === 'above' ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )}
                          {s.suggestion_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 font-mono text-xs">
                        ${s.target_price.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 px-3 hidden sm:table-cell">
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{s.reasoning}</p>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => handleApply(s)}
                            disabled={applyingId === s.id}
                          >
                            {applyingId === s.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Bell className="w-2.5 h-2.5 mr-0.5" />
                                Apply
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Applied Suggestions */}
          {appliedSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">Applied</p>
              <Card className="overflow-hidden opacity-70">
                <Table>
                  <TableBody>
                    {appliedSuggestions.slice(0, 5).map(s => (
                      <TableRow key={s.id} className="group">
                        <TableCell className="py-1.5 px-3">
                          <span className="font-semibold text-xs">{s.asset_symbol}</span>
                        </TableCell>
                        <TableCell className="py-1.5 px-3">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            {s.suggestion_type} ${s.target_price.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="w-2.5 h-2.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </>
      )}

      {isGenerating && (
        <Card className="p-4 text-center border-dashed">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-1.5" />
          <p className="text-xs text-muted-foreground">Analyzing support & resistance levels...</p>
        </Card>
      )}
    </div>
  );
}
