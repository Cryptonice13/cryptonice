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
      setTimeout(() => window.dispatchEvent(new CustomEvent('open-agent-workspace')), 50);
    } else {
      window.dispatchEvent(new CustomEvent('open-agent-workspace'));
    }
  };

  const items = [
    { icon: Bot, label: 'Chat', onClick: goChat, isActive: onChat },
    { icon: PanelRight, label: 'Workspace', onClick: openWorkspace, isActive: false, primary: true },
    { icon: Users, label: 'Community', onClick: goCommunity, isActive: location.pathname === '/community' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <nav className="flex items-end justify-around px-2 pt-2 pb-1 h-16">
        {items.map((item, i) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <button
                key={i}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center ring-4 ring-background">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium mt-0.5 text-foreground">{item.label}</span>
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={item.onClick}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors',
                item.isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
                  item.isActive && 'bg-primary/10',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;
