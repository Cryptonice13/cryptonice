import { motion } from "framer-motion";
import { ArrowRight, Wallet, TrendingUp, Shield, Zap, Lock, Globe, ChevronDown, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const tokenIcons = [
  { symbol: "ETH", color: "#627EEA", delay: 0 },
  { symbol: "BTC", color: "#F7931A", delay: 2 },
  { symbol: "USDC", color: "#2775CA", delay: 4 },
  { symbol: "DAI", color: "#F5AC37", delay: 6 },
  { symbol: "LINK", color: "#375BD2", delay: 8 },
];

const stats = [
  { label: "Total Value Locked", value: "$500M+", icon: Lock },
  { label: "Active Users", value: "50K+", icon: Globe },
  { label: "Transactions", value: "1M+", icon: Zap },
  { label: "Supported Chains", value: "5+", icon: Shield },
];

const steps = [
  {
    step: "01",
    title: "Deposit",
    description: "Connect your wallet and deposit crypto assets to start earning yield instantly.",
    icon: Wallet,
  },
  {
    step: "02",
    title: "Borrow",
    description: "Use your deposits as collateral to borrow assets at competitive rates.",
    icon: TrendingUp,
  },
  {
    step: "03",
    title: "Grow",
    description: "Watch your portfolio grow with automated yield optimization strategies.",
    icon: Zap,
  },
];

const testimonials = [
  {
    name: "Alex Chen",
    role: "DeFi Investor",
    content: "The best lending platform I've used. Transparent rates and seamless experience.",
    avatar: "AC",
    rating: 5,
  },
  {
    name: "Sarah Miller",
    role: "Crypto Trader",
    content: "Finally a platform that makes borrowing against my crypto simple and secure.",
    avatar: "SM",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Yield Farmer",
    content: "Incredible APY rates and the multi-chain support is a game changer.",
    avatar: "DP",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How does the lending protocol work?",
    answer: "Our protocol allows you to deposit crypto assets into liquidity pools. These deposits earn interest from borrowers who use the pools. Interest rates are determined algorithmically based on supply and demand.",
  },
  {
    question: "What is the collateralization ratio?",
    answer: "The collateralization ratio varies by asset but typically ranges from 75-85%. This means you can borrow up to 75-85% of your collateral value while maintaining a healthy position.",
  },
  {
    question: "How are my assets secured?",
    answer: "All smart contracts are audited by leading security firms. We use battle-tested code, real-time monitoring, and have an active bug bounty program. Assets are secured on-chain with no custodial risk.",
  },
  {
    question: "What happens if my position gets liquidated?",
    answer: "If your health factor drops below 1.0, your position may be liquidated. Liquidators repay part of your debt and receive your collateral at a discount. We recommend maintaining a health factor above 1.5.",
  },
  {
    question: "Which chains are supported?",
    answer: "We support Ethereum, Arbitrum, Polygon, Optimism, and Base. More chains are being added regularly to provide maximum flexibility and lower gas costs.",
  },
];

const chains = [
  { name: "Ethereum", color: "#627EEA" },
  { name: "Arbitrum", color: "#28A0F0" },
  { name: "Polygon", color: "#8247E5" },
  { name: "Optimism", color: "#FF0420" },
  { name: "Base", color: "#0052FF" },
];

const Index = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      navigate('/home');
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 grid-pattern">
        <div className="radial-gradient-overlay absolute inset-0" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
              >
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Live on Mainnet</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Earn Up to{" "}
                <span className="text-gradient">15% APY</span>
                <br />
                Lend & Borrow Crypto{" "}
                <span className="text-muted-foreground">Seamlessly</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                The next generation DeFi lending protocol. Deposit your assets, earn yield, 
                and borrow against your portfolio with industry-leading rates.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="button-gradient text-lg px-8 py-6 h-auto"
                  onClick={() => navigate('/markets')}
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto border-border/50 hover:bg-secondary"
                  onClick={() => navigate('/markets')}
                >
                  Explore Markets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Audited by CertiK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Non-Custodial</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Orbiting Tokens Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-[500px] hidden lg:flex items-center justify-center"
            >
              {/* Central wallet */}
              <div className="absolute w-40 h-40 rounded-2xl glass glow-primary flex items-center justify-center animate-float">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Wallet className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>

              {/* Orbiting tokens */}
              {tokenIcons.map((token, index) => (
                <div
                  key={token.symbol}
                  className="absolute w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    animation: `orbit ${20 + index * 5}s linear infinite`,
                    animationDelay: `${token.delay}s`,
                    backgroundColor: token.color,
                  }}
                >
                  <span className="text-white font-bold text-xs">{token.symbol}</span>
                </div>
              ))}

              {/* Orbit rings */}
              <div className="absolute w-[300px] h-[300px] rounded-full border border-border/20" />
              <div className="absolute w-[400px] h-[400px] rounded-full border border-border/10" />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/30 bg-card/50">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start earning in three simple steps. No complex setup required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="glass rounded-2xl p-8 h-full transition-all duration-300 hover:bg-white/10 gradient-border">
                  <div className="text-6xl font-bold text-gradient opacity-30 mb-4">{step.step}</div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Dynamic Rates,{" "}
                <span className="text-gradient">Maximum Returns</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Our algorithmic interest rate model ensures optimal yields based on real-time 
                market conditions. Watch your assets grow with transparent, competitive rates.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Real-time APY adjustments based on utilization",
                  "No hidden fees or complex structures",
                  "Compound interest automatically",
                  "Withdraw anytime with no lockups",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Chain badges */}
              <div className="flex flex-wrap gap-3">
                {chains.map((chain) => (
                  <div
                    key={chain.name}
                    className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: chain.color }}
                    />
                    {chain.name}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Rate Graph Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8 glow-primary">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Supply APY</h3>
                  <span className="text-3xl font-bold text-gradient">12.5%</span>
                </div>
                
                {/* Simulated chart */}
                <div className="h-48 relative mb-6">
                  <svg className="w-full h-full" viewBox="0 0 400 150">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(160, 84%, 45%)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(160, 84%, 45%)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,120 Q50,100 100,80 T200,60 T300,40 T400,30"
                      fill="none"
                      stroke="hsl(160, 84%, 45%)"
                      strokeWidth="3"
                    />
                    <path
                      d="M0,120 Q50,100 100,80 T200,60 T300,40 T400,30 L400,150 L0,150 Z"
                      fill="url(#chartGradient)"
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground">Utilization</div>
                    <div className="text-lg font-semibold">78%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground">Borrow APR</div>
                    <div className="text-lg font-semibold">8.2%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground">Liquidity</div>
                    <div className="text-lg font-semibold">$45M</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by <span className="text-gradient">Thousands</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our community has to say about their experience.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-8 md:p-12 text-center"
            >
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </motion.div>

            {/* Carousel dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial 
                      ? "bg-primary w-8" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-card/30">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Security <span className="text-gradient">FAQ</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your security is our priority. Find answers to common questions.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <AccordionItem 
                    value={`item-${index}`} 
                    className="glass rounded-xl px-6 border-none"
                  >
                    <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 md:p-16 text-center glow-primary"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Start <span className="text-gradient">Earning?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of users already earning yield on their crypto assets. 
              Connect your wallet and start in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="button-gradient text-lg px-10 py-6 h-auto"
                onClick={() => navigate('/markets')}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Launch App
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-6 h-auto border-border/50 hover:bg-secondary"
              >
                Read Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
