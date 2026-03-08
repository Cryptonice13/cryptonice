import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, TrendingUp, Bell, PieChart, Target, Zap } from 'lucide-react';
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
  label: string;
  route?: string;
  chatPrompt?: string;
  color: string;
}

export function QuickActions({ assets, portfolioSymbols = [], onChatAction }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = useMemo<QuickAction[]>(() => {
    const result: QuickAction[] = [];
    if (assets.length === 0) return result;

    // Big dropper
    const bigDrop = assets.filter(a => a.priceChange24h < -5).slice(0, 1);
    bigDrop.forEach(a => {
      result.push({
        id: `dip-${a.symbol}`,
        icon: <TrendingDown className="w-3 h-3" />,
        label: `${a.symbol} ▼${Math.abs(a.priceChange24h).toFixed(1)}%`,
        chatPrompt: `Should I buy ${a.symbol} now that it's down ${Math.abs(a.priceChange24h).toFixed(1)}%?`,
        color: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
      });
    });

    // Big gainer
    const bigGain = assets.filter(a => a.priceChange24h > 8).slice(0, 1);
    bigGain.forEach(a => {
      result.push({
        id: `rally-${a.symbol}`,
        icon: <TrendingUp className="w-3 h-3" />,
        label: `${a.symbol} ▲${a.priceChange24h.toFixed(1)}%`,
        chatPrompt: `${a.symbol} is up ${a.priceChange24h.toFixed(1)}%. Should I take profit?`,
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
      });
    });

    // Diversify
    if (portfolioSymbols.length > 0 && portfolioSymbols.length < 3) {
      result.push({
        id: 'diversify',
        icon: <PieChart className="w-3 h-3" />,
        label: 'Diversify portfolio',
        chatPrompt: `My portfolio has ${portfolioSymbols.join(', ')}. Suggest diversification.`,
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
      });
    }

    // Volatile alert
    const volatile = assets.filter(a => Math.abs(a.priceChange24h) > 3).slice(0, 1);
    volatile.forEach(a => {
      if (!result.some(r => r.id.includes(a.symbol))) {
        result.push({
          id: `alert-${a.symbol}`,
          icon: <Bell className="w-3 h-3" />,
          label: `Set ${a.symbol} alert`,
          route: '/alerts',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
        });
      }
    });

    return result.slice(0, 4);
  }, [assets, portfolioSymbols]);

  if (actions.length === 0) return null;

  const handleAction = (action: QuickAction) => {
    if (action.route) navigate(action.route);
    else if (action.chatPrompt && onChatAction) onChatAction(action.chatPrompt);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action, i) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => handleAction(action)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${action.color}`}
        >
          {action.icon}
          {action.label}
          <Zap className="w-2.5 h-2.5 opacity-60" />
        </motion.button>
      ))}
    </div>
  );
}
