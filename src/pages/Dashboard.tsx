import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Bell,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Activity,
  Shield,
  PieChart,
  BarChart3,
  Clock,
  Target,
  Zap,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from '@/components/MobileBottomNav';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useMarketData } from '@/hooks/useMarketData';
import { usePortfolioDb } from '@/hooks/usePortfolioDb';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function MarketTicker({ assets }: { assets: any[] }) {
  const top = assets.slice(0, 8);
  if (top.length === 0) return null;
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/30 bg-card/50">
      <div className="flex gap-0 animate-marquee-smooth whitespace-nowrap py-2 px-3">
        {[...top, ...top].map((a, i) => (
          <div key={`${a.id}-${i}`} className="inline-flex items-center gap-2 px-3 border-r border-border/20 last:border-0">
            <img src={a.logo} alt={a.symbol} className="w-4 h-4 rounded-full" />
            <span className="text-xs font-medium text-foreground">{a.symbol}</span>
            <span className="text-xs text-muted-foreground">${a.price < 1 ? a.price.toFixed(4) : a.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${a.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {a.priceChange24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(a.priceChange24h).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address } = useAccount();
  const [userName, setUserName] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const { assets } = useMarketData();
  const { portfolio } = usePortfolioDb(address, user?.id);

  // DB-driven state
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);

  const col = user?.id ? 'user_id' : 'wallet_address';
  const val = user?.id || address;

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', authUser.id).maybeSingle();
        if (profile?.name) setUserName(profile.name);
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    if (!val) return;
    const fetchAll = async () => {
      const [wlRes, strRes, alertRes, txRes, analysisRes, predRes, alertCountRes] = await Promise.all([
        supabase.from('user_watchlist').select('*').eq(col, val).limit(5),
        supabase.from('strategies').select('*').eq(col, val).order('updated_at', { ascending: false }).limit(5),
        supabase.from('alert_history').select('*').eq(col, val).order('triggered_at', { ascending: false }).limit(5),
        supabase.from('portfolio_transactions').select('*').eq(col, val).order('created_at', { ascending: false }).limit(5),
        supabase.from('ai_portfolio_analysis').select('*').eq(col, val).order('created_at', { ascending: false }).limit(1),
        supabase.from('ai_predictions').select('*').eq(col, val).order('created_at', { ascending: false }).limit(3),
        supabase.from('user_watchlist').select('id', { count: 'exact', head: true }).eq(col, val).not('alert_price', 'is', null),
      ]);
      setWatchlist(wlRes.data || []);
      setStrategies(strRes.data || []);
      setRecentAlerts(alertRes.data || []);
      setRecentTransactions(txRes.data || []);
      setLatestAnalysis(analysisRes.data?.[0] || null);
      setRecentPredictions(predRes.data || []);
      setAlertCount(alertCountRes.count || 0);
    };
    fetchAll();
  }, [col, val]);

  const priceMap = useMemo(() => {
    const m = new Map<string, number>();
    assets.forEach(a => m.set(a.id, a.price));
    return m;
  }, [assets]);

  const totalValue = useMemo(() => portfolio.reduce((s, p) => s + p.amount * (priceMap.get(p.asset_id) || 0), 0), [portfolio, priceMap]);
  const totalPnL = useMemo(() => portfolio.reduce((s, p) => {
    const cur = p.amount * (priceMap.get(p.asset_id) || 0);
    return s + (cur - p.amount * p.avg_buy_price);
  }, 0), [portfolio, priceMap]);

  const btc = assets.find(a => a.symbol === 'BTC');
  const btcChange = btc?.priceChange24h ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader activePage="dashboard" />

      <main className="flex-1 pt-12 pb-20 lg:pb-4">
        <ScrollArea className="h-[calc(100vh-48px)]">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">

            {/* Welcome + Chat CTA */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 border border-primary/10 p-4 sm:p-5"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold truncate">{getGreeting()}{userName ? `, ${userName}` : ''}</h1>
                    <p className="text-xs text-muted-foreground">Your AI-powered crypto command center</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/chat')} className="button-gradient gap-2 flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Chat</span>
                </Button>
              </div>
              <div className="mt-3">
                <QuickActions assets={assets} portfolioSymbols={portfolio.map(p => p.asset_symbol)} onChatAction={() => navigate('/chat')} />
              </div>
            </motion.div>

            {/* Market Ticker */}
            <MarketTicker assets={assets} />

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  label: 'Portfolio Value', icon: <Wallet className="w-4 h-4" />,
                  value: totalValue > 0 ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—',
                  sub: totalPnL !== 0 ? `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}` : 'Add assets',
                  subColor: totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500',
                  accent: 'border-t-primary', onClick: () => navigate('/portfolio'),
                },
                {
                  label: 'Market Trend', icon: btcChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
                  value: btc ? `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(1)}%` : '—',
                  sub: btcChange >= 2 ? 'Bullish' : btcChange <= -2 ? 'Bearish' : 'Neutral',
                  subColor: btcChange >= 0 ? 'text-emerald-500' : 'text-red-500',
                  accent: btcChange >= 0 ? 'border-t-emerald-500' : 'border-t-red-500', onClick: () => navigate('/markets'),
                },
                {
                  label: 'Active Alerts', icon: <Bell className="w-4 h-4" />,
                  value: String(alertCount), sub: alertCount > 0 ? 'Monitoring' : 'Set up alerts',
                  subColor: 'text-muted-foreground', accent: 'border-t-amber-500', onClick: () => navigate('/alerts'),
                },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card className={`p-3 cursor-pointer hover:bg-muted/30 transition-colors border-t-2 ${s.accent}`} onClick={s.onClick}>
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{s.icon}<span className="text-[10px] sm:text-xs font-medium">{s.label}</span></div>
                    <p className="text-base sm:text-lg font-bold truncate">{s.value}</p>
                    <p className={`text-[10px] sm:text-xs ${s.subColor} truncate`}>{s.sub}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tabbed Sections */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-9">
                <TabsTrigger value="overview" className="text-xs"><PieChart className="w-3 h-3 mr-1" />Overview</TabsTrigger>
                <TabsTrigger value="watchlist" className="text-xs"><Eye className="w-3 h-3 mr-1" />Watchlist</TabsTrigger>
                <TabsTrigger value="strategies" className="text-xs"><Target className="w-3 h-3 mr-1" />Strategies</TabsTrigger>
                <TabsTrigger value="activity" className="text-xs"><Activity className="w-3 h-3 mr-1" />Activity</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-3 mt-3">
                {/* AI Health Score */}
                {latestAnalysis && (
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Portfolio Health</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{new Date(latestAnalysis.created_at).toLocaleDateString()}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                            strokeDasharray={`${latestAnalysis.health_score}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{latestAnalysis.health_score}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Risk:</span>
                          <Badge variant={latestAnalysis.risk_level === 'low' ? 'default' : latestAnalysis.risk_level === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {latestAnalysis.risk_level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Diversification:</span>
                          <span className="text-xs font-medium">{latestAnalysis.diversification}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/portfolio')}>
                      View Full Analysis <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Card>
                )}

                {/* Portfolio Holdings Summary */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" />Holdings</h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/portfolio')}>View All</Button>
                  </div>
                  {portfolio.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No holdings yet. Add assets in Portfolio.</p>
                  ) : (
                    <div className="space-y-2">
                      {portfolio.slice(0, 5).map(p => {
                        const price = priceMap.get(p.asset_id) || 0;
                        const value = p.amount * price;
                        const pnl = value - p.amount * p.avg_buy_price;
                        return (
                          <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                            <div className="flex items-center gap-2">
                              {p.asset_logo && <img src={p.asset_logo} className="w-5 h-5 rounded-full" alt={p.asset_symbol} />}
                              <div>
                                <p className="text-xs font-medium">{p.asset_symbol}</p>
                                <p className="text-[10px] text-muted-foreground">{p.amount.toFixed(4)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">${value.toFixed(2)}</p>
                              <p className={`text-[10px] ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* AI Predictions */}
                {recentPredictions.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />Recent AI Predictions</h3>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/insights')}>All Insights</Button>
                    </div>
                    <div className="space-y-2">
                      {recentPredictions.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <div>
                              <p className="text-xs font-medium">{p.asset_symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">${p.current_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* WATCHLIST TAB */}
              <TabsContent value="watchlist" className="mt-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Your Watchlist</h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/alerts')}>Manage</Button>
                  </div>
                  {watchlist.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No watchlist items. Add from Markets page.</p>
                  ) : (
                    <div className="space-y-2">
                      {watchlist.map(w => {
                        const asset = assets.find(a => a.id === w.asset_id);
                        return (
                          <div key={w.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                            <div className="flex items-center gap-2">
                              {w.asset_logo && <img src={w.asset_logo} className="w-5 h-5 rounded-full" alt={w.asset_symbol} />}
                              <div>
                                <p className="text-xs font-medium">{w.asset_symbol}</p>
                                <p className="text-[10px] text-muted-foreground">{w.asset_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{asset ? `$${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}</p>
                              {w.alert_price && (
                                <p className="text-[10px] text-amber-500 flex items-center gap-0.5 justify-end">
                                  <Bell className="w-2.5 h-2.5" />${w.alert_price}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* STRATEGIES TAB */}
              <TabsContent value="strategies" className="mt-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Active Strategies</h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/strategy')}>View All</Button>
                  </div>
                  {strategies.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No strategies yet. Create one in Strategy Builder.</p>
                  ) : (
                    <div className="space-y-2">
                      {strategies.map(s => (
                        <div key={s.id} className="p-3 rounded-lg bg-muted/30 border border-border/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold truncate">{s.strategy_name}</p>
                            <Badge variant={s.signal === 'BUY' ? 'default' : s.signal === 'SELL' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {s.signal}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>{s.asset_symbol}</span>
                            <span>•</span>
                            <span>{s.timeframe}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-[9px] h-4">{s.risk_level}</Badge>
                          </div>
                          {s.confidence && (
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${s.confidence}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* ACTIVITY TAB */}
              <TabsContent value="activity" className="space-y-3 mt-3">
                {/* Recent Transactions */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-primary" />Recent Transactions</h3>
                  {recentTransactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No transactions recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.transaction_type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                              {tx.transaction_type === 'buy' ? <ArrowDownRight className="w-3 h-3 text-emerald-500" /> : <ArrowUpRight className="w-3 h-3 text-red-500" />}
                            </div>
                            <div>
                              <p className="text-xs font-medium capitalize">{tx.transaction_type} {tx.asset_symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">${tx.total_value.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">{tx.amount} @ ${tx.price_per_unit.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Recent Alert History */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-primary" />Alert History</h3>
                  {recentAlerts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No triggered alerts yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentAlerts.map(a => (
                        <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                          <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-amber-500" />
                            <div>
                              <p className="text-xs font-medium">{a.asset_symbol} {a.alert_type}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(a.triggered_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">${a.triggered_price.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">Target: ${a.target_price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>

          </div>
        </ScrollArea>
      </main>

      <MobileBottomNav />
    </div>
  );
}
