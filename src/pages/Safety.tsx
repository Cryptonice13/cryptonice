import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Loader2, Sparkles, Zap, Clock, History, ExternalLink, Trash2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSafetyScan } from '@/hooks/useSafetyScan';
import { useCredits } from '@/hooks/useCredits';
import RiskGauge from '@/components/safety/RiskGauge';
import FactorList from '@/components/safety/FactorList';
import { cn } from '@/lib/utils';

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', explorer: 'https://etherscan.io/token/' },
  { id: 'bsc', name: 'BNB Chain', explorer: 'https://bscscan.com/token/' },
  { id: 'polygon', name: 'Polygon', explorer: 'https://polygonscan.com/token/' },
  { id: 'arbitrum', name: 'Arbitrum', explorer: 'https://arbiscan.io/token/' },
  { id: 'optimism', name: 'Optimism', explorer: 'https://optimistic.etherscan.io/token/' },
  { id: 'base', name: 'Base', explorer: 'https://basescan.org/token/' },
  { id: 'avalanche', name: 'Avalanche', explorer: 'https://snowtrace.io/token/' },
];

const EXAMPLES = [
  { label: 'USDC (safe)', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'ethereum' },
  { label: 'PEPE (live)', addr: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', chain: 'ethereum' },
];

export default function Safety() {
  const [contract, setContract] = useState('');
  const [chain, setChain] = useState('ethereum');
  const { scanning, scan, runScan, history, refreshHistory, loadScanById, SCAN_COST } = useSafetyScan();
  const { balance } = useCredits();

  const handleScan = () => {
    runScan(contract, chain);
  };

  const fillExample = (e: typeof EXAMPLES[0]) => {
    setContract(e.addr);
    setChain(e.chain);
  };

  const explorerUrl = (s: typeof scan) => {
    if (!s) return '#';
    const c = CHAINS.find(c => c.id === s.chain);
    return (c?.explorer || 'https://etherscan.io/token/') + s.contract_address;
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <AppHeader />

      <main className="pt-16 px-3 sm:px-4 lg:px-6 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-5 sm:py-7"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Token Safety Scanner</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Paste any contract → AI risk score in seconds. Avoid honeypots & rug pulls.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scanner card */}
        <Card className="p-4 sm:p-5 mb-5 border-primary/20">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Contract Address
              </label>
              <Input
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
                disabled={scanning}
              />
            </div>
            <div className="sm:w-44">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Chain</label>
              <Select value={chain} onValueChange={setChain} disabled={scanning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !contract.trim()}
              className="button-gradient"
            >
              {scanning ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Scanning...</>
              ) : (
                <><Search className="w-4 h-4 mr-1.5" /> Scan ({SCAN_COST} credits)</>
              )}
            </Button>
          </div>

          {/* Examples + balance */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Try:</span>
              {EXAMPLES.map(e => (
                <Button key={e.addr} variant="outline" size="sm" className="h-6 px-2 text-xs"
                  onClick={() => fillExample(e)} disabled={scanning}>
                  {e.label}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              Balance: <span className="font-semibold text-foreground">{balance ?? '...'}</span>
            </div>
          </div>
        </Card>

        {/* Result */}
        {scan && (
          <motion.div
            key={scan.id || scan.contract_address}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                <div className="flex-shrink-0">
                  <RiskGauge
                    score={scan.risk_score}
                    level={scan.risk_level}
                    recommendation={scan.recommendation}
                  />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {scan.token_logo && (
                          <img src={scan.token_logo} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <h2 className="text-lg font-bold truncate">
                          {scan.token_name || 'Unknown Token'}
                        </h2>
                        {scan.token_symbol && (
                          <Badge variant="outline" className="text-xs">{scan.token_symbol}</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs uppercase">{scan.chain}</Badge>
                      </div>
                      <a
                        href={explorerUrl(scan)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary font-mono mt-1 inline-flex items-center gap-1"
                      >
                        {scan.contract_address.slice(0, 10)}...{scan.contract_address.slice(-8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {scan.ai_verdict && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">AI Verdict</span>
                      </div>
                      <p className="text-sm leading-relaxed">{scan.ai_verdict}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Detailed Risk Factors
                <Badge variant="outline" className="text-xs ml-auto">{scan.factors?.length || 0} checks</Badge>
              </h3>
              <FactorList factors={scan.factors || []} />
            </Card>
          </motion.div>
        )}

        {/* History */}
        <Tabs defaultValue="history" className="mb-6">
          <TabsList>
            <TabsTrigger value="history">
              <History className="w-3.5 h-3.5 mr-1.5" /> Scan History
            </TabsTrigger>
            <TabsTrigger value="how">How it works</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-3">
            {history.length === 0 ? (
              <Card className="p-8 text-center">
                <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No scans yet. Run your first scan above.</p>
              </Card>
            ) : (
              <div className="grid gap-2">
                {history.map(h => (
                  <Card
                    key={h.id}
                    className="p-3 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => loadScanById(h.id!)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center font-bold tabular-nums text-sm',
                        h.risk_score >= 75 ? 'bg-red-500/15 text-red-500' :
                        h.risk_score >= 50 ? 'bg-orange-500/15 text-orange-500' :
                        h.risk_score >= 30 ? 'bg-amber-500/15 text-amber-500' :
                        h.risk_score >= 15 ? 'bg-lime-500/15 text-lime-500' :
                                              'bg-emerald-500/15 text-emerald-500'
                      )}>
                        {h.risk_score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {h.token_name || 'Unknown'}
                          </span>
                          {h.token_symbol && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{h.token_symbol}</Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 uppercase">{h.chain}</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                          {h.contract_address}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] uppercase font-bold',
                          h.recommendation === 'AVOID' ? 'border-red-500/40 text-red-500' :
                          h.recommendation === 'CAUTION' ? 'border-amber-500/40 text-amber-500' :
                                                            'border-emerald-500/40 text-emerald-500'
                        )}
                      >
                        {h.recommendation}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="how" className="mt-3">
            <Card className="p-5 space-y-3 text-sm">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-primary" /> What we check</h4>
                <ul className="text-muted-foreground space-y-1 ml-6 list-disc text-xs">
                  <li><b>Honeypot</b> — can you actually sell, or are you stuck?</li>
                  <li><b>Mint function</b> — can the owner print infinite supply?</li>
                  <li><b>Owner privileges</b> — hidden owner, balance edit, pausable transfers</li>
                  <li><b>Buy/sell tax</b> — high taxes = stealth honeypot</li>
                  <li><b>Holder concentration</b> — owner & top 10 holders</li>
                  <li><b>Liquidity</b> — locked? burned? sufficient depth?</li>
                  <li><b>Pair age</b> — fresh pairs are highest rug-risk</li>
                  <li><b>Source code</b> — verified or hidden logic?</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-primary" /> AI verdict</h4>
                <p className="text-muted-foreground text-xs">
                  Our AI reads all on-chain signals and writes a 2-3 sentence verdict in plain English — no jargon. Tells you straight up: trade or run.
                </p>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-primary" /> Caching</h4>
                <p className="text-muted-foreground text-xs">
                  Identical scans within 24h are loaded from cache (no credit charge for the team). Each unique scan costs {SCAN_COST} credits.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileBottomNav />
    </div>
  );
}
