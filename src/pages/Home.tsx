import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MobileBottomNav from '@/components/MobileBottomNav';
import AppHeader from '@/components/AppHeader';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { MiniSparkline } from '@/components/ai/MiniSparkline';
import { useMarketData } from '@/hooks/useMarketData';
import cryptoaiLogo from '@/assets/cryptoai-logo.jpg';
import {
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
  Activity,
  Globe,
  MessageCircle,
} from 'lucide-react';
import CryptoAnalystAgent from '@/components/ai/CryptoAnalystAgent';

const testimonials = [
  { name: 'Alex Chen', role: 'Crypto Trader', company: 'Independent', text: 'CryptoAI completely changed how I analyze the market. The AI insights are incredibly accurate and saved me thousands.', avatar: 'AC' },
  { name: 'Sarah Kim', role: 'Portfolio Manager', company: 'BlockFund Capital', text: 'Smart alerts saved me from a major downturn. Best crypto intelligence tool I\'ve used in my career.', avatar: 'SK' },
  { name: 'Marcus Johnson', role: 'DeFi Investor', company: 'Yield Labs', text: 'The whale tracker alone is worth it. I can see big moves before they happen — real edge in the market.', avatar: 'MJ' },
  { name: 'Elena Rodriguez', role: 'Day Trader', company: 'TradeFlow', text: 'Real-time AI signals with actual market data? This is the future of crypto trading. Nothing else compares.', avatar: 'ER' },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI Advisor',
    description: 'Chat with an AI analyst that has real-time access to live market data, prices, and trends.',
    link: '/dashboard',
    step: '01',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'AI-suggested price alerts based on support/resistance levels. Never miss a critical move.',
    link: '/alerts',
    step: '02',
  },
  {
    icon: PieChart,
    title: 'Portfolio Tracker',
    description: 'Track holdings with performance charts, risk analysis, and diversification insights.',
    link: '/portfolio',
    step: '03',
  },
];

const stats = [
  { icon: Users, label: 'Active Users', target: 125000, suffix: '+', format: (v: number) => v.toLocaleString() },
  { icon: BarChart3, label: 'AI Analyses', target: 2400000, suffix: '+', format: (v: number) => `${(v / 1e6).toFixed(1)}M` },
  { icon: Zap, label: 'Assets Tracked', target: 50, suffix: '+', format: (v: number) => v.toString() },
  { icon: Shield, label: 'Uptime', target: 99.9, suffix: '%', format: (v: number) => v.toFixed(1) },
];

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

const Home = () => {
  const navigate = useNavigate();
  const { assets, isLoading } = useMarketData();
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const topAssets = assets.slice(0, 6);
  const trendingAssets = assets.slice(0, 8);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex(prev => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[15%] w-[800px] h-[800px] bg-primary/6 rounded-full blur-[160px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[140px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />
        <div className="grid-pattern absolute inset-0 opacity-15" />
      </div>

      <AppHeader />

      <main className="pt-16 relative z-10">
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="container mx-auto px-4 pt-16 pb-8 lg:pt-28 lg:pb-16">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 px-5 py-2 text-sm font-medium">
                <Activity className="w-3.5 h-3.5 mr-2 animate-pulse" />
                Live AI-Powered Analytics
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.05] tracking-tight"
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
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Real-time market analysis, AI-driven predictions, smart alerts, and portfolio tracking — all in one powerful platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
            >
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="button-gradient text-primary-foreground font-semibold px-10 py-7 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Launch Dashboard
              </Button>
              <Button
                onClick={() => navigate('/markets')}
                size="lg"
                variant="outline"
                className="px-10 py-7 text-lg rounded-full border-border/50 hover:bg-muted/50"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Explore Markets
              </Button>
            </motion.div>

            {/* Trusted By */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="pt-8 flex flex-col items-center gap-3"
            >
              <span className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">Trusted by teams at</span>
              <div className="flex items-center gap-8 text-muted-foreground/30 text-sm font-semibold tracking-wide">
                {['Coinbase', 'Binance', 'Kraken', 'Gemini', 'BlockFi'].map(name => (
                  <span key={name} className="hidden sm:block hover:text-muted-foreground/50 transition-colors">{name}</span>
                ))}
                {['Coinbase', 'Binance', 'Kraken'].map(name => (
                  <span key={`m-${name}`} className="block sm:hidden">{name}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ TRENDING TICKER (Marquee) ═══════════════ */}
        {!isLoading && trendingAssets.length > 0 && (
          <section className="relative border-y border-border/20 bg-muted/10 overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee-smooth py-3">
              {[...trendingAssets, ...trendingAssets, ...trendingAssets].map((asset, i) => (
                <button
                  key={`${asset.id}-${i}`}
                  onClick={() => navigate('/markets')}
                  className="flex items-center gap-2.5 shrink-0 px-5 hover:bg-muted/20 py-1.5 rounded-lg transition-colors"
                >
                  <img src={asset.logo} alt={asset.name} className="w-5 h-5 rounded-full" />
                  <span className="text-sm font-semibold text-foreground">{asset.symbol}</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    ${asset.price.toLocaleString(undefined, { maximumFractionDigits: asset.price < 1 ? 4 : 2 })}
                  </span>
                  <span className={`text-xs font-bold ${asset.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {asset.priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(asset.priceChange24h).toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════ FEATURE CARDS ═══════════════ */}
        <section className="container mx-auto px-4 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Professional-grade crypto tools powered by artificial intelligence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: 0.15 * i, duration: 0.6 }}
              >
                <div
                  className="group relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8 h-full cursor-pointer transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.3)]"
                  onClick={() => navigate(feature.link)}
                >
                  {/* Step indicator */}
                  <span className="absolute top-6 right-6 text-5xl font-black text-muted/30 select-none leading-none">
                    {feature.step}
                  </span>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">{feature.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════ ANALYST AGENT ═══════════════ */}
        <section className="relative py-20 lg:py-28">
          {/* Darker inset background */}
          <div className="absolute inset-0 bg-muted/30 border-y border-border/20" />
          <div className="absolute inset-0 radial-gradient-overlay opacity-30" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="text-xs uppercase tracking-widest text-primary font-semibold">Live Agent</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Ask the Analyst</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                An emotionless AI agent analyzing live BTC data, 7-day SMA, and crypto news — delivering strict verdicts.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <CryptoAnalystAgent />
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ MARKET SNAPSHOT ═══════════════ */}
        <section className="container mx-auto px-4 py-20 lg:py-28">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl lg:text-4xl font-bold text-foreground">Market Snapshot</h2>
              <p className="text-muted-foreground text-sm mt-1">Live prices across top assets</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/markets')} className="text-primary text-sm font-semibold">
              View All <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {topAssets.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06 * i }}
              >
                <Card
                  className="group relative overflow-hidden border-border/30 bg-card/70 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate('/markets')}
                >
                  <div className="p-5">
                    {/* Rank badge */}
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded-full">
                      #{i + 1}
                    </span>

                    <div className="flex items-center gap-3 mb-4">
                      <img src={asset.logo} alt={asset.name} className="w-9 h-9 rounded-full" />
                      <div>
                        <p className="font-bold text-sm text-foreground">{asset.symbol}</p>
                        <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mb-3">
                      <p className="font-mono text-xl font-bold text-foreground">
                        ${asset.price.toLocaleString(undefined, { maximumFractionDigits: asset.price < 1 ? 4 : 2 })}
                      </p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        asset.priceChange24h >= 0
                          ? 'text-primary bg-primary/10'
                          : 'text-destructive bg-destructive/10'
                      }`}>
                        {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Full-width sparkline */}
                  <div className="w-full h-12 -mb-1">
                    <MiniSparkline data={asset.sparkline} positive={asset.priceChange7d >= 0} width={400} height={48} />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      View Details →
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════ STATS STRIP ═══════════════ */}
        <section className="border-y border-border/20 bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => {
                const { value, ref } = useCountUp(stat.target);
                return (
                  <div
                    key={stat.label}
                    ref={ref}
                    className={`py-10 lg:py-14 text-center ${
                      i < stats.length - 1 ? 'border-r border-border/20' : ''
                    } ${i >= 2 ? 'border-t lg:border-t-0 border-border/20' : ''}`}
                  >
                    <div className="border-t-2 border-primary/60 w-8 mx-auto mb-4" />
                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-3" />
                    <p className="text-3xl lg:text-4xl font-bold text-foreground mb-1">
                      {stat.format(value)}{stat.suffix}
                    </p>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════ TESTIMONIALS ═══════════════ */}
        <section className="container mx-auto px-4 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">Trusted by Traders Worldwide</h2>
            <p className="text-muted-foreground text-lg">See what our community is saying</p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-3xl p-8 lg:p-12 border border-border/30 relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[80px]" />

              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="min-h-[140px]"
                >
                  <p className="text-lg lg:text-2xl text-foreground font-light leading-relaxed mb-8 italic">
                    "{testimonials[testimonialIndex].text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-primary to-accent">
                      <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {testimonials[testimonialIndex].avatar}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{testimonials[testimonialIndex].name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonials[testimonialIndex].role} · <span className="text-primary/80">{testimonials[testimonialIndex].company}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === testimonialIndex ? 'bg-primary w-8' : 'bg-muted-foreground/20 w-1.5'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTestimonialIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="p-2.5 rounded-full border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => setTestimonialIndex(prev => (prev + 1) % testimonials.length)}
                    className="p-2.5 rounded-full border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ CTA ═══════════════ */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <div className="relative rounded-3xl overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${4 + i}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 py-16 lg:py-24 px-8 text-center">
              <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground mb-4">
                Start Making Smarter Trades
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10">
                Join thousands of traders using AI to navigate the crypto markets with confidence.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 font-bold px-12 py-7 text-lg rounded-full shadow-2xl"
              >
                <Brain className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer className="border-t border-border/30 mt-8">
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
              {/* Brand */}
              <div className="col-span-2 lg:col-span-1 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg text-foreground">CryptoAI</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-powered crypto intelligence for the modern trader.
                </p>
                <div className="flex gap-3">
                  {[
                    { icon: MessageCircle, label: 'Discord' },
                    { icon: Globe, label: 'Website' },
                  ].map(social => (
                    <a
                      key={social.label}
                      href="#"
                      className="w-9 h-9 rounded-lg border border-border/40 flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <social.icon className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm">Product</h4>
                <ul className="space-y-2">
                  {['Dashboard', 'Markets', 'Portfolio', 'Alerts'].map(item => (
                    <li key={item}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm">Resources</h4>
                <ul className="space-y-2">
                  {['Documentation', 'API', 'Blog', 'Changelog'].map(item => (
                    <li key={item}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm">Company</h4>
                <ul className="space-y-2">
                  {['About', 'Careers', 'Contact', 'Press'].map(item => (
                    <li key={item}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground text-sm">Legal</h4>
                <ul className="space-y-2">
                  {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
                    <li key={item}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border/20 flex flex-col lg:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">© 2026 CryptoAI. All rights reserved.</p>
              <p className="text-xs text-muted-foreground/60">Crypto trading involves significant risk. This is not financial advice.</p>
            </div>
          </div>
        </footer>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Home;
