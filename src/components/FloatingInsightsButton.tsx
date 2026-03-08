import { useLocation, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const HIDDEN_ROUTES = ['/', '/login', '/insights'];

export default function FloatingInsightsButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const visible = !HIDDEN_ROUTES.includes(location.pathname);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed right-4 top-14 z-50"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/insights')}
                className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Brain className="w-4 h-4 text-primary-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              AI Insights
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
