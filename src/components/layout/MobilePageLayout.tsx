import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Bot,
  Wallet,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import MobileBottomNav from '@/components/MobileBottomNav';

interface MobilePageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  noPadding?: boolean;
}

export function MobilePageLayout({ 
  children, 
  title, 
  subtitle, 
  headerActions,
  noPadding = false 
}: MobilePageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      connect({ connector: injected() });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItems = [
    { path: '/home', label: 'Dashboard' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/markets', label: 'Markets' },
    { path: '/alerts', label: 'Alerts' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 safe-area-top">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">CryptoAI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Profile Icon - always visible */}
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
                    <span className="text-xs">{formatAddress(address!)}</span>
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
                Connect
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 pt-14 pb-20 lg:pb-6 ${noPadding ? '' : 'px-4'}`}>
        {/* Page Header */}
        {(title || headerActions) && (
          <div className={`${noPadding ? 'px-4' : ''} py-4 flex items-center justify-between gap-3`}>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        )}
        
        {children}
      </main>

      <MobileBottomNav />
    </div>
  );
}
