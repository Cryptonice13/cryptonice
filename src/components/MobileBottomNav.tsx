import { Bot, Radio, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onChat = location.pathname === '/chat';

  const goChat = () => {
    if (onChat) {
      window.dispatchEvent(new CustomEvent('open-agent-workspace'));
    } else {
      navigate('/chat');
    }
  };

  const items = [
    { icon: Bot, label: 'Chat and Workspace', onClick: goChat, isActive: onChat },
    { icon: Radio, label: 'Realtime Market', onClick: () => navigate('/realtime'), isActive: location.pathname === '/realtime' },
    { icon: Users, label: 'Community', onClick: () => navigate('/community'), isActive: location.pathname === '/community' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <nav aria-label="Main menu" className="flex items-center justify-around px-2 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.label}
              variant="ghost"
              size="icon"
              onClick={item.onClick}
              aria-label={item.label}
              title={item.label}
              aria-current={item.isActive ? 'page' : undefined}
              className={cn(
                'h-11 flex-1 max-w-20 rounded-md transition-colors',
                item.isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground active:text-foreground',
              )}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
