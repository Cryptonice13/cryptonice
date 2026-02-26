import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp, Bell, PieChart, Zap, AlertTriangle, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { CryptoAsset } from '@/hooks/useMarketData';

interface QuickActionsProps {
  assets: CryptoAsset[];
  portfolioSymbols?: string[];
  onChatAction?: (message: string) => void;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  message: string;
  actionLabel: string;
  route?: string;
  chatPrompt?: string;
  color: string;
}

export function QuickActions({ assets, portfolioSymbols = [], onChatAction }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = useMemo<QuickAction[]>(() => {
    const result: QuickAction[] = [];

    if (assets.length === 0) return result;

    // Find big movers (down > 5%)
    const bigDroppers = assets.filter(a => a.priceChange24h < -5).slice(0, 1);
    bigDroppers.forEach(a => {
      result.push({
        id: `dip-${a.symbol}`,
        icon: <TrendingDown className="w-4 h-4" />,
        message: `${a.symbol} down ${Math.abs(a.priceChange24h).toFixed(1)}% — Buy the dip?`,
        actionLabel: 'Analyze',
        chatPrompt: `Should I buy ${a.symbol} now that it's down ${Math.abs(a.priceChange24h).toFixed(1)}%? Current price is $${a.price.toLocaleString()}`,
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
      });
    });

    // Find big gainers (up > 8%)
    const bigGainers = assets.filter(a => a.priceChange24h > 8).slice(0, 1);
    bigGainers.forEach(a => {
      result.push({
        id: `rally-${a.symbol}`,
        icon: <TrendingUp className="w-4 h-4" />,
        message: `${a.symbol} up ${a.priceChange24h.toFixed(1)}% — Take profit?`,
        actionLabel: 'Analyze',
        chatPrompt: `${a.symbol} is up ${a.priceChange24h.toFixed(1)}% in 24h. Should I take profit at $${a.price.toLocaleString()}?`,
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
      });
    });

    // Portfolio concentration check
    if (portfolioSymbols.length > 0 && portfolioSymbols.length < 3) {
      result.push({
        id: 'diversify',
        icon: <PieChart className="w-4 h-4" />,
        message: `Portfolio has only ${portfolioSymbols.length} asset${portfolioSymbols.length > 1 ? 's' : ''} — Diversify?`,
        actionLabel: 'Suggest',
        chatPrompt: `My portfolio only has ${portfolioSymbols.join(', ')}. Suggest diversification options.`,
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      });
    }

    // Set alerts suggestion for top volatile assets
    const volatile = assets.filter(a => Math.abs(a.priceChange24h) > 3).slice(0, 1);
    volatile.forEach(a => {
      if (!result.some(r => r.id.includes(a.symbol))) {
        result.push({
          id: `alert-${a.symbol}`,
          icon: <Bell className="w-4 h-4" />,
          message: `${a.symbol} is volatile today — Set an alert?`,
          actionLabel: 'Set Alert',
          route: '/alerts',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        });
      }
    });

    // Market opportunity
    const btc = assets.find(a => a.symbol === 'BTC');
    if (btc && btc.priceChange24h > 0 && btc.priceChange24h < 2) {
      result.push({
        id: 'market-stable',
        icon: <Target className="w-4 h-4" />,
        message: 'Market is calm — Good time for DCA',
        actionLabel: 'Learn More',
        chatPrompt: 'The market seems stable right now. Is this a good time for dollar-cost averaging?',
        color: 'bg-primary/10 text-primary border-primary/20',
      });
    }

    return result.slice(0, 5);
  }, [assets, portfolioSymbols]);

  if (actions.length === 0) return null;

  const handleAction = (action: QuickAction) => {
    if (action.route) {
      navigate(action.route);
    } else if (action.chatPrompt && onChatAction) {
      onChatAction(action.chatPrompt);
    }
  };

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 lg:mx-0 lg:px-0">
      {actions.map((action, i) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex-shrink-0"
        >
          <Card
            className={`p-3 min-w-[200px] max-w-[240px] border cursor-pointer hover:scale-[1.02] transition-transform ${action.color}`}
            onClick={() => handleAction(action)}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">{action.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight">{action.message}</p>
                <p className="text-[10px] mt-1.5 font-semibold opacity-80 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {action.actionLabel}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
