import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MobileBottomNav from '@/components/MobileBottomNav';
import AppHeader from '@/components/AppHeader';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { MiniSparkline } from '@/components/ai/MiniSparkline';
import { useMarketData } from '@/hooks/useMarketData';
import {
  Brain,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Bell,
  PieChart,
  BarChart3,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Lock,
} from 'lucide-react';
import CryptoAnalystAgent from '@/components/ai/CryptoAnalystAgent';

const testimonials = [
  { name: 'Alex Chen', role: 'Crypto Trader', text: 'CryptoAI completely changed how I analyze the market. The AI insights are incredibly accurate.', avatar: 'AC' },
  { name: 'Sarah Kim', role: 'Portfolio Manager', text: 'Smart alerts saved me from a major downturn. Best crypto tool I\'ve used.', avatar: 'SK' },
  { name: 'Marcus Johnson', role: 'DeFi Investor', text: 'The whale tracker alone is worth it. I can see big moves before they happen.', avatar: 'MJ' },
  { name: 'Elena Rodriguez', role: 'Day Trader', text: 'Real-time AI signals with actual market data? This is the future of crypto trading.', avatar: 'ER' },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI Advisor',
    description: 'Chat with an AI analyst that has real-time access to live market data, prices, and trends.',
    link: '/dashboard',
    color: 'from-primary to-accent',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'AI-suggested price alerts based on support/resistance levels. Never miss a move.',
    link: '/alerts',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: PieChart,
    title: 'Portfolio Tracker',
    description: 'Track your holdings with performance charts, risk analysis, and diversification insights.',
    link: '/portfolio',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { assets, isLoading } = useMarketData();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [animatedUsers, setAnimatedUsers] = useState(0);
  const [animatedAnalyses, setAnimatedAnalyses] = useState(0);

  const topAssets = assets.slice(0, 6);
  const trendingAssets = assets.slice(0, 5);

  useEffect(() => {
    const usersInterval = setInterval(() => {
      setAnimatedUsers(prev => prev >= 125000 ? 125000 : prev + 2500);
    }, 30);
    const analysesInterval = setInterval(() => {
      setAnimatedAnalyses(prev => prev >= 2400000 ? 2400000 : prev + 48000);
    }, 30);
    return () => { clearInterval(usersInterval); clearInterval(analysesInterval); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="grid-pattern absolute inset-0 opacity-20" />
      </div>

      <AppHeader />

      <main className="pt-16 relative z-10">
        {/* Hero */}
        <section className="container mx-auto px-4 py-12 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm mb-4">
                <Brain className="w-3.5 h-3.5 mr-1.5" />
                AI-Powered Analytics
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight"
            >
              <span className="text-foreground">Crypto Intelligence</span>
              <br />
              <span className="text-gradient">
                <TextGenerateEffect words="Powered by AI" className="text-gradient" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Real-time market analysis, AI-driven predictions, smart alerts, and portfolio tracking — all in one platform.
            </motion.p>

            {/* Live Price Ticker in Hero */}
            {!isLoading && trendingAssets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4 flex-wrap"
              >
                {trendingAssets.slice(0, 3).map(asset => (
                  <div key={asset.id} className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
                    <img src={asset.logo} alt={asset.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-semibold">{asset.symbol}</span>
                    <span className="text-sm font-mono">${asset.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className={`text-xs font-medium ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.priceChange24h >= 0 ? '↑' : '↓'}{Math.abs(asset.priceChange24h).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/30"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Launch Dashboard
              </Button>
              <Button
                onClick={() => navigate('/markets')}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg rounded-xl border-border/50"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Explore Markets
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Trending Ticker */}
        {!isLoading && trendingAssets.length > 0 && (
          <section className="border-y border-border/30 bg-muted/20">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-6 overflow-x-auto mobile-scroll">
                <span className="text-xs text-muted-foreground font-medium shrink-0">🔥 Trending</span>
                {trendingAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => navigate('/markets')}
                    className="flex items-center gap-2 shrink-0 hover:bg-muted/30 px-2 py-1 rounded-lg transition-colors"
                  >
                    <img src={asset.logo} alt={asset.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-medium">{asset.symbol}</span>
                    <span className="text-sm font-mono text-muted-foreground">
                      ${asset.price.toLocaleString(undefined, { maximumFractionDigits: asset.price < 1 ? 4 : 2 })}
                    </span>
                    <span className={`text-xs font-semibold ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Feature Showcase */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold text-foreground mb-3">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Professional-grade crypto tools powered by artificial intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="glass p-6 border-border/50 hover:border-primary/30 transition-all cursor-pointer h-full group"
                  onClick={() => navigate(feature.link)}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Ask the Analyst */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-4xl font-bold text-foreground mb-3">Ask the Analyst</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              An emotionless AI agent that analyzes live BTC data, calculates the 7-day SMA, and scans crypto news — then delivers a strict verdict.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <CryptoAnalystAgent />
          </div>
        </section>

        {/* Market Snapshot */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Market Snapshot</h2>
            <Button variant="ghost" onClick={() => navigate('/markets')} className="text-primary text-sm">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {topAssets.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Card
                  className="glass p-4 border-border/30 hover:border-primary/20 transition-all cursor-pointer"
                  onClick={() => navigate('/markets')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img src={asset.logo} alt={asset.name} className="w-7 h-7 rounded-full" />
                      <div>
                        <p className="font-semibold text-sm">{asset.symbol}</p>
                        <p className="text-[10px] text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                    </span>
                  </div>
                  <p className="font-mono text-lg font-bold mb-2">
                    ${asset.price.toLocaleString(undefined, { maximumFractionDigits: asset.price < 1 ? 4 : 2 })}
                  </p>
                  <MiniSparkline data={asset.sparkline} positive={asset.priceChange7d >= 0} width={120} height={32} />
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats + Testimonials */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Stats */}
            <div className="space-y-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Trusted by Traders Worldwide</h2>
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass p-5 border-border/50 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gradient">{animatedUsers.toLocaleString()}+</p>
                  <p className="text-muted-foreground text-xs">Active Users</p>
                </Card>
                <Card className="glass p-5 border-border/50 text-center">
                  <BarChart3 className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gradient">{(animatedAnalyses / 1e6).toFixed(1)}M+</p>
                  <p className="text-muted-foreground text-xs">AI Analyses</p>
                </Card>
                <Card className="glass p-5 border-border/50 text-center">
                  <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">50+</p>
                  <p className="text-muted-foreground text-xs">Assets Tracked</p>
                </Card>
                <Card className="glass p-5 border-border/50 text-center">
                  <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">99.9%</p>
                  <p className="text-muted-foreground text-xs">Uptime</p>
                </Card>
              </div>
            </div>

            {/* Testimonials */}
            <div className="glass rounded-2xl p-6 lg:p-8 border border-border/50">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <div className="min-h-[100px] mb-4">
                <p className="text-base lg:text-lg text-foreground italic mb-4">
                  "{testimonials[testimonialIndex].text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {testimonials[testimonialIndex].avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonials[testimonialIndex].name}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[testimonialIndex].role}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${index === testimonialIndex ? 'bg-primary' : 'bg-secondary'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)} className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)} className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-12">
          <Card className="glass p-8 lg:p-12 border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/15 rounded-full blur-[80px]" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl lg:text-4xl font-bold mb-3 text-foreground">
                Start Making Smarter Trades
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of traders using AI to navigate the crypto markets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg rounded-xl shadow-lg shadow-primary/30"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 mt-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">CryptoAI</span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Docs</a>
                <a href="#" className="hover:text-primary transition-colors">Support</a>
              </div>
              <p className="text-sm text-muted-foreground">© 2026 CryptoAI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Home;
