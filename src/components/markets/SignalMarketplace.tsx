import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Users, CheckCircle2, XCircle, Clock, Loader2, Award, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSignalMarketplace, type PublishedSignal, type PublisherStats } from '@/hooks/useSignalMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/format';
import { EditSignalDialog } from './EditSignalDialog';

function PublisherDetailSheet({ publisher, open, onOpenChange }: {
  publisher: PublisherStats | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { getPublisherSignals, followingIds, followPublisher, deleteSignal } = useSignalMarketplace();
  const { user } = useAuth();
  const [signals, setSignals] = useState<PublishedSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<PublishedSignal | null>(null);
  const [deleting, setDeleting] = useState<PublishedSignal | null>(null);

  const reload = useCallback(() => {
    if (!publisher) return;
    setLoading(true);
    getPublisherSignals(publisher.publisher_user_id).then(s => {
      setSignals(s);
      setLoading(false);
    });
  }, [publisher, getPublisherSignals]);

  useEffect(() => {
    if (publisher && open) reload();
  }, [publisher, open, reload]);

  if (!publisher) return null;
  const isFollowing = followingIds.has(publisher.publisher_user_id);
  const isMe = user?.id === publisher.publisher_user_id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92%] sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Publisher Profile</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Avatar className="w-14 h-14">
              <AvatarImage src={publisher.publisher_avatar || undefined} />
              <AvatarFallback>{(publisher.publisher_name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{publisher.publisher_name || 'Anonymous Trader'}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{publisher.follower_count}</span>
                <span>{publisher.total_signals} signals</span>
              </div>
            </div>
            {!isMe && (
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                onClick={() => followPublisher(publisher.publisher_user_id)}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
              <p className={`text-lg font-bold ${publisher.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {publisher.win_rate}%
              </p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total P&L</p>
              <p className={`text-lg font-bold ${publisher.total_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {publisher.total_pnl_pct >= 0 ? '+' : ''}{publisher.total_pnl_pct}%
              </p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg P&L</p>
              <p className={`text-lg font-bold ${publisher.avg_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {publisher.avg_pnl_pct >= 0 ? '+' : ''}{publisher.avg_pnl_pct}%
              </p>
            </Card>
          </div>

          {/* Signals list */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Signals</h4>
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
            ) : signals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No signals yet</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {signals.map(s => (
                    <Card key={s.id} className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge className={s.signal === 'BUY' ? 'bg-green-500/20 text-green-400' : s.signal === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-muted'}>
                            {s.signal}
                          </Badge>
                          <span className="text-sm font-semibold">{s.asset_symbol}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] h-5 ${
                          s.outcome === 'win' ? 'border-green-500/50 text-green-400' :
                          s.outcome === 'loss' ? 'border-red-500/50 text-red-400' :
                          s.outcome === 'expired' ? 'border-muted-foreground/40' :
                          'border-blue-500/40 text-blue-400'
                        }`}>
                          {s.outcome === 'win' && <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />}
                          {s.outcome === 'loss' && <XCircle className="w-2.5 h-2.5 mr-0.5" />}
                          {(s.outcome === 'pending' || !s.outcome) && <Clock className="w-2.5 h-2.5 mr-0.5" />}
                          {s.outcome || 'pending'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-muted-foreground">
                        <div>Entry: <span className="font-mono text-foreground">{formatPrice(s.entry_price)}</span></div>
                        <div>SL: <span className="font-mono text-red-400">{formatPrice(s.stop_loss)}</span></div>
                        <div>{s.timeframe}</div>
                      </div>
                      {s.pnl_pct != null && (
                        <p className={`text-xs font-mono mt-1.5 ${s.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {s.pnl_pct >= 0 ? '+' : ''}{s.pnl_pct.toFixed(2)}% realized
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{s.reasoning}</p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SignalMarketplace() {
  const { leaderboard, isLoading, followingIds, followPublisher } = useSignalMarketplace();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'pnl' | 'winrate' | 'followers'>('pnl');
  const [selectedPublisher, setSelectedPublisher] = useState<PublisherStats | null>(null);

  const sorted = [...leaderboard].sort((a, b) => {
    if (sortBy === 'winrate') return b.win_rate - a.win_rate;
    if (sortBy === 'followers') return b.follower_count - a.follower_count;
    return b.total_pnl_pct - a.total_pnl_pct;
  });

  return (
    <div className="space-y-3">
      <Card className="glass-card p-3 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Verified Signal Marketplace</h3>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
              No paid shilling. Every signal is auto-tracked against live prices — wins and losses are verified, not claimed.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Tabs value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <TabsList className="h-8">
            <TabsTrigger value="pnl" className="text-xs gap-1"><BarChart3 className="w-3 h-3" />P&L</TabsTrigger>
            <TabsTrigger value="winrate" className="text-xs gap-1"><Award className="w-3 h-3" />Win Rate</TabsTrigger>
            <TabsTrigger value="followers" className="text-xs gap-1"><Users className="w-3 h-3" />Followers</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-[10px] text-muted-foreground">{sorted.length} publishers</span>
      </div>

      {isLoading ? (
        <Card className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></Card>
      ) : sorted.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold mb-1">No Published Signals Yet</h3>
          <p className="text-xs text-muted-foreground">
            Be the first to publish a verified signal. Generate a Trading Signal on the Spot tab and click "Publish".
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((p, i) => {
            const isFollowing = followingIds.has(p.publisher_user_id);
            const isMe = user?.id === p.publisher_user_id;
            return (
              <motion.div
                key={p.publisher_user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="glass-card p-3 cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedPublisher(p)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={p.publisher_avatar || undefined} />
                      <AvatarFallback>{(p.publisher_name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{p.publisher_name || 'Anonymous'}</p>
                        {isMe && <Badge variant="outline" className="text-[9px] h-4 px-1">You</Badge>}
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground mt-0.5">
                        <span>{p.total_signals} signals</span>
                        <span>•</span>
                        <span>{p.follower_count} followers</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold font-mono ${p.total_pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {p.total_pnl_pct >= 0 ? '+' : ''}{p.total_pnl_pct}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        WR {p.win_rate}%
                      </div>
                    </div>
                    {!isMe && (
                      <Button
                        size="sm"
                        variant={isFollowing ? 'outline' : 'default'}
                        className="h-7 px-2.5 text-[10px]"
                        onClick={(e) => { e.stopPropagation(); followPublisher(p.publisher_user_id); }}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <PublisherDetailSheet
        publisher={selectedPublisher}
        open={!!selectedPublisher}
        onOpenChange={(o) => { if (!o) setSelectedPublisher(null); }}
      />
    </div>
  );
}
