import { Link, useNavigate } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { handleMobileDeepLink, hasInjectedProvider } from '@/lib/walletConnect';
import { Bot, Wallet, Settings, User, LogOut, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  activePage?: 'dashboard' | 'portfolio' | 'markets' | 'alerts' | 'strategy';
  rightContent?: React.ReactNode;
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'portfolio', label: 'Portfolio', path: '/portfolio' },
  { key: 'markets', label: 'Markets', path: '/markets' },
  { key: 'strategy', label: 'Strategy', path: '/strategy' },
  { key: 'alerts', label: 'Alerts', path: '/alerts' },
] as const;

export default function AppHeader({ activePage, rightContent }: AppHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    if (handleMobileDeepLink()) return;
    if (!hasInjectedProvider()) {
      toast({
        title: 'No Wallet Found',
        description: 'Please install MetaMask or use a Web3-enabled browser.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await connectAsync({ connector: injected() });
      toast({ title: 'Wallet Connected', description: 'Your wallet has been connected successfully.' });
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: 'Connection Failed',
        description: (error as Error)?.message || 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 safe-area-top">
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:block">CryptoAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`text-sm font-medium transition-colors ${
                activePage === item.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {rightContent}

          {/* AI Chat Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/insights')}
            className="h-8 w-8 relative"
          >
            <Brain className="w-4 h-4 text-primary" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </Button>

          {/* Profile Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="h-8 w-8"
          >
            <User className="w-4 h-4" />
          </Button>

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 px-2">
                  <Wallet className="w-3.5 h-3.5" />
                  <span className="text-xs hidden xs:inline">{formatAddress(address!)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => disconnect()} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleConnect} size="sm" className="button-gradient h-8 px-3 text-xs">
              <Wallet className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden xs:inline">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
