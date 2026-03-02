import { Home, LineChart, Briefcase, Bell, Bot, Cpu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      name: 'Home',
      icon: Bot,
      path: '/dashboard',
    },
    {
      name: 'Markets',
      icon: LineChart,
      path: '/markets',
    },
    {
      name: 'Portfolio',
      icon: Briefcase,
      path: '/portfolio',
    },
    {
      name: 'Strategy',
      icon: Cpu,
      path: '/strategy',
    },
    {
      name: 'Alerts',
      icon: Bell,
      path: '/alerts',
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "text-primary"
              )}>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
