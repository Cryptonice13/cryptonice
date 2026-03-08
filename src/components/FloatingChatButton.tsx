import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const HIDDEN_ROUTES = ['/', '/login', '/chat', '/settings', '/profile', '/credits'];

export default function FloatingChatButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <button
      onClick={() => navigate('/chat')}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      aria-label="Open AI Chat"
    >
      <MessageCircle className="w-5 h-5" />
    </button>
  );
}
