import { Home, LineChart, Briefcase, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/home',
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
      name: 'Alerts',
      icon: Bell,
      path: '/alerts',
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <nav className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
