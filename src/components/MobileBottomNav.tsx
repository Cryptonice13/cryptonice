import { Home, LineChart, Briefcase, Bot, Cpu, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Bot, path: '/dashboard' },
    { icon: LineChart, path: '/markets' },
    { icon: Briefcase, path: '/portfolio' },
    { icon: Cpu, path: '/strategy' },
    { icon: Users, path: '/community' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center justify-center flex-1 h-full transition-colors",
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
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
