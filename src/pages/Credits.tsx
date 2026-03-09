import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { PaymentDialog } from '@/components/credits/PaymentDialog';
import { Zap, ArrowLeft, History, CreditCard, Sparkles, Loader2 } from 'lucide-react';

const CREDIT_COSTS = [
  { feature: 'AI Chat Message', cost: 1 },
  { feature: 'Portfolio Analysis', cost: 3 },
  { feature: 'Market Prediction', cost: 3 },
  { feature: 'Trading Signal', cost: 2 },
  { feature: 'Technical/Fundamental Analysis', cost: 5 },
  { feature: 'Crypto Analyst Query', cost: 2 },
  { feature: 'Whale Activity', cost: 2 },
];

const PLANS = [
  { key: 'basic' as const, name: 'Basic', price: 5, credits: 150, popular: false },
  { key: 'pro' as const, name: 'Pro', price: 25, credits: 800, popular: true },
  { key: 'enterprise' as const, name: 'Enterprise', price: 100, credits: 3500, popular: false },
];

const Credits = () => {
  const navigate = useNavigate();
  const { balance, isLoading, purchaseCredits } = useCredits();
  const { user } = useAuth();
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [paymentPlan, setPaymentPlan] = useState<typeof PLANS[number] | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id && !address) { setLoadingTx(false); return; }
      
      let query = supabase.from('credit_transactions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (user?.id) query = query.eq('user_id', user.id);
      else query = query.eq('wallet_address', address);

      const { data } = await query;
      setTransactions((data as any[]) || []);
      setLoadingTx(false);
    };
    loadTransactions();
  }, [user, address, balance]);

  const handlePurchase = (plan: typeof PLANS[number]) => {
    setPaymentPlan(plan);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = async (planKey: string, couponCode?: string) => {
    const result = await purchaseCredits(planKey as 'basic' | 'pro' | 'enterprise', couponCode);
    return !!result;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <AppHeader />
      <div className="pt-16 px-4 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Credits</h1>
            <p className="text-sm text-muted-foreground">Manage your AI usage credits</p>
          </div>
        </div>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Zap className="w-8 h-8 text-primary" />
                    <span className="text-4xl font-bold text-foreground">
                      {isLoading ? '...' : (balance ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">credits available</p>
                </div>
                {(balance ?? 0) <= 10 && (
                  <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Credit Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Credit Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CREDIT_COSTS.map((item) => (
                <div key={item.feature} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">{item.feature}</span>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />{item.cost}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Plans */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Buy Credits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <motion.div key={plan.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={`relative ${plan.popular ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                      Most Popular
                    </Badge>
                  )}
                  <CardContent className="pt-6 text-center space-y-3">
                    <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                    <div className="text-3xl font-bold text-foreground">${plan.price}</div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{plan.credits}</span>
                      <span className="text-sm">credits</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(plan)}
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          plan={paymentPlan}
          onComplete={handlePaymentComplete}
        />

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Usage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description || tx.transaction_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} · {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant={tx.amount > 0 ? 'default' : 'destructive'} className="text-xs">
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default Credits;
