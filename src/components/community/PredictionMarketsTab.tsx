import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, TrendingDown, Clock, Users, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  usePredictionMarkets,
  type PredictionMarket,
} from '@/hooks/usePredictionMarkets';
import { CreateMarketDialog } from './CreateMarketDialog';
import { TradeMarketDialog } from './TradeMarketDialog';
import { formatCredits, marketStatusLabel } from '@/lib/predictionMarkets';

function statusStyle(status: string) {
  switch (status) {
    case 'open':
      return 'text-emerald-400 border-emerald-500/30';
    case 'closed':
      return 'text-yellow-400 border-yellow-500/30';
    case 'resolved':
      return 'text-primary border-primary/30';
    case 'review':
      return 'text-orange-400 border-orange-500/30';
    default:
      return 'text-muted-foreground border-border/60';
  }
}

function MarketCard({
  market,
  onTrade,
}: {
  market: PredictionMarket;
  onTrade: (market: PredictionMarket) => void;
}) {
  const isOpen = market.status === 'open' && new Date(market.close_at) > new Date();

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug">{market.question}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              by {market.creator_name} · {market.asset_symbol} {market.direction} $
              {Number(market.target_price).toLocaleString()}
            </p>
          </div>
          <Badge variant="outline" className={cn('text-[10px] shrink-0', statusStyle(market.status))}>
            {marketStatusLabel(market.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Yes
            </p>
            <p className="text-base font-semibold text-emerald-400">{Math.round(market.yes_price)} cr</p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> No
            </p>
            <p className="text-base font-semibold text-red-400">{Math.round(market.no_price)} cr</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isOpen
              ? `closes ${formatDistanceToNow(new Date(market.close_at), { addSuffix: true })}`
              : `settles ${formatDistanceToNow(new Date(market.resolve_at), { addSuffix: true })}`}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {market.participant_count} traders
          </span>
          <span>{formatCredits(market.volume_credits)} traded</span>
        </div>

        {market.status === 'resolved' && (
          <p className="text-xs text-muted-foreground">
            Result: <span className="font-medium text-foreground">{market.outcome?.toUpperCase()}</span>
            {market.observed_price != null && ` at $${Number(market.observed_price).toLocaleString()}`}
          </p>
        )}
        {market.status === 'review' && (
          <p className="text-xs text-orange-400">
            The price source was unavailable, so this market is waiting for a manual check.
          </p>
        )}

        <Button
          size="sm"
          className="w-full"
          variant={isOpen ? 'default' : 'outline'}
          disabled={!isOpen}
          onClick={() => onTrade(market)}
        >
          {isOpen ? 'Trade this market' : 'Trading closed'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PredictionMarketsTab() {
  const { user } = useAuth();
  const {
    markets,
    positions,
    loading,
    submitting,
    error,
    createMarket,
    placeOrder,
    settleDueMarkets,
    refresh,
  } = usePredictionMarkets();

  const [query, setQuery] = useState('');
  const [activeMarket, setActiveMarket] = useState<PredictionMarket | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  useEffect(() => {
    settleDueMarkets();
    // Settlement sweep runs once when the markets tab mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return markets;
    return markets.filter(
      m => m.question.toLowerCase().includes(q) || m.asset_symbol.toLowerCase().includes(q),
    );
  }, [markets, query]);

  const openMarkets = filtered.filter(m => m.status === 'open');
  const otherMarkets = filtered.filter(m => m.status !== 'open');

  const handleTrade = (market: PredictionMarket) => {
    setActiveMarket(market);
    setTradeOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets or assets"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={refresh} aria-label="Refresh markets">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <CreateMarketDialog submitting={submitting} onCreate={createMarket} />
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="settled">Settled</TabsTrigger>
          <TabsTrigger value="positions">My bets</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-3 mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading markets...</p>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : openMarkets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No open markets yet. Create the first one.
            </p>
          ) : (
            openMarkets.map(m => <MarketCard key={m.id} market={m} onTrade={handleTrade} />)
          )}
        </TabsContent>

        <TabsContent value="settled" className="space-y-3 mt-4">
          {otherMarkets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nothing settled yet.</p>
          ) : (
            otherMarkets.map(m => <MarketCard key={m.id} market={m} onTrade={handleTrade} />)
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-3 mt-4">
          {!user ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sign in to see your bets.</p>
          ) : positions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              You have not placed any bets yet.
            </p>
          ) : (
            positions.map(p => (
              <Card key={p.id} className="border-border/50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium leading-snug">
                    {p.market?.question || 'Prediction market'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        p.side === 'yes'
                          ? 'text-emerald-400 border-emerald-500/30'
                          : 'text-red-400 border-red-500/30',
                      )}
                    >
                      {p.side.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground">
                      {p.quantity} shares · avg {Math.round(Number(p.average_price))} cr
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Spent {formatCredits(p.total_cost)}</span>
                    {p.settled_at ? (
                      <span className={p.payout > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {p.payout > 0 ? `Won ${formatCredits(p.payout)}` : 'No payout'}
                      </span>
                    ) : (
                      <span>Could win {formatCredits(p.quantity * 100)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <TradeMarketDialog
        market={activeMarket}
        open={tradeOpen}
        submitting={submitting}
        canTrade={!!user && activeMarket?.creator_id !== user?.id}
        onOpenChange={setTradeOpen}
        onPlaceOrder={placeOrder}
      />
    </div>
  );
}
