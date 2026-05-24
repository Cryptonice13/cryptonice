import { Bot, PanelRight, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onChat = location.pathname === '/chat';

  const goChat = () => navigate('/chat');
  const goCommunity = () => navigate('/community');
  const openWorkspace = () => {
    if (!onChat) {
      navigate('/chat');
      // Wait a tick for Chat to mount before dispatching
      setTimeout(() => window.dispatchEvent(new CustomEvent('open-agent-workspace')), 50);
    } else {
      window.dispatchEvent(new CustomEvent('open-agent-workspace'));
    }
  };

  const items = [
    { icon: Bot, onClick: goChat, isActive: onChat && !location.search },
    { icon: PanelRight, onClick: openWorkspace, isActive: false, primary: true },
    { icon: Users, onClick: goCommunity, isActive: location.pathname === '/community' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around h-14">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.onClick}
              className={cn(
                'flex items-center justify-center flex-1 h-full transition-colors',
                item.isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl',
                  item.primary ? 'w-12 h-12 bg-primary text-primary-foreground shadow-lg' : 'w-10 h-10',
                  item.isActive && !item.primary && 'bg-primary/10',
                )}
              >
                <Icon className={cn(item.primary ? 'w-6 h-6' : 'w-5 h-5')} />
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
