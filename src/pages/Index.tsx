import { motion } from "framer-motion";
import { ArrowRight, Brain, TrendingUp, Shield, Zap, BarChart3, Bot, ChevronDown, Star, Check, LineChart, Bell, Wallet } from "lucide-react";
import cryptoaiLogo from "@/assets/cryptoai-logo.jpg";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";

const cryptoIcons = [
{ symbol: "BTC", color: "#F7931A", delay: 0 },
{ symbol: "ETH", color: "#627EEA", delay: 2 },
{ symbol: "SOL", color: "#9945FF", delay: 4 },
{ symbol: "ADA", color: "#0033AD", delay: 6 },
{ symbol: "AVAX", color: "#E84142", delay: 8 }];


const stats = [
{ label: "AI Predictions", value: "95%+", sublabel: "Accuracy", icon: Brain },
{ label: "Active Users", value: "50K+", sublabel: "Worldwide", icon: BarChart3 },
{ label: "Trading Signals", value: "10K+", sublabel: "Daily", icon: TrendingUp },
{ label: "Cryptocurrencies", value: "100+", sublabel: "Analyzed", icon: LineChart }];


const steps = [
{
  step: "01",
  title: "Connect Wallet",
  description: "Link your crypto wallet for personalized AI analysis of your holdings and portfolio optimization.",
  icon: Wallet
},
{
  step: "02",
  title: "Get AI Insights",
  description: "Receive real-time market predictions, trading signals, and portfolio analysis powered by advanced AI.",
  icon: Brain
},
{
  step: "03",
  title: "Make Smarter Trades",
  description: "Execute informed trades with AI-generated buy/sell signals and risk assessments.",
  icon: TrendingUp
}];


const testimonials = [
{
  name: "Alex Chen",
  role: "Crypto Trader",
  content: "The AI predictions have completely transformed my trading strategy. Incredible accuracy!",
  avatar: "AC",
  rating: 5
},
{
  name: "Sarah Miller",
  role: "Portfolio Manager",
  content: "Finally an AI that actually understands crypto markets. The portfolio analysis is invaluable.",
  avatar: "SM",
  rating: 5
},
{
  name: "David Park",
  role: "Day Trader",
  content: "The trading signals are spot on. I've increased my returns significantly since using this.",
  avatar: "DP",
  rating: 5
}];


const faqs = [
{
  question: "How does the AI analyze crypto markets?",
  answer: "Our AI uses advanced machine learning models trained on historical market data, social sentiment, on-chain metrics, and technical indicators to provide accurate predictions and trading signals."
},
{
  question: "What kind of trading signals do you provide?",
  answer: "We provide BUY, SELL, and HOLD signals with entry prices, stop-loss levels, and take-profit targets. Each signal includes a confidence score and detailed reasoning."
},
{
  question: "How accurate are the AI predictions?",
  answer: "Our AI achieves over 95% accuracy on short-term predictions. We continuously improve our models and provide transparent confidence scores with every prediction."
},
{
  question: "Is my wallet information secure?",
  answer: "Yes, we use read-only wallet connections. We never have access to your private keys or the ability to move your funds. Your security is our top priority."
},
{
  question: "What cryptocurrencies do you analyze?",
  answer: "We analyze over 100 major cryptocurrencies including Bitcoin, Ethereum, Solana, Cardano, and many more. New coins are added regularly based on market demand."
}];


const features = [
{
  title: "Portfolio Analysis",
  description: "AI-powered health scores and optimization suggestions",
  icon: BarChart3
},
{
  title: "Market Predictions",
  description: "Short and medium-term price forecasts with confidence levels",
  icon: LineChart
},
{
  title: "Trading Signals",
  description: "Real-time BUY/SELL/HOLD signals with entry and exit points",
  icon: TrendingUp
},
{
  title: "Price Alerts",
  description: "Custom alerts when assets hit your target prices",
  icon: Bell
}];


const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Redirect authenticated users (including mobile) to /home
  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

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
              className="text-left">
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">AI-Powered Analysis</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Your{" "}
                <span className="text-gradient">AI Crypto</span>
                <br />
                Advisor &{" "}
                <span className="text-muted-foreground">Analyzer</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                Make smarter crypto decisions with AI-powered portfolio analysis, 
                market predictions, and real-time trading signals.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="button-gradient text-lg px-8 py-6 h-auto"
                  onClick={() => navigate('/home')}>
                  
                  <Bot className="mr-2 h-5 w-5" />
                  Start AI Analysis
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto border-border/50 hover:bg-secondary"
                  onClick={() => navigate('/markets')}>
                  
                  View Markets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Read-Only Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Advanced AI Models</span>
                </div>
              </div>
            </motion.div>

            {/* Right - AI Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative h-[500px] hidden lg:flex items-center justify-center">
              
              {/* Central AI Brain */}
              <div className="absolute w-40 h-40 rounded-2xl glass glow-primary flex items-center justify-center animate-float">
                <img src={cryptoaiLogo} alt="CryptoAI" className="w-24 h-24 rounded-xl" />
              </div>

              {/* Orbiting crypto icons */}
              {cryptoIcons.map((token, index) =>
              <div
                key={token.symbol}
                className="absolute w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  animation: `orbit ${20 + index * 5}s linear infinite`,
                  animationDelay: `${token.delay}s`,
                  backgroundColor: token.color
                }}>
                
                  <span className="text-white font-bold text-xs">{token.symbol}</span>
                </div>
              )}

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
          className="absolute bottom-10 left-1/2 -translate-x-1/2">
          
          <ChevronDown className="w-8 h-8 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/30 bg-card/50">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) =>
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center">
              
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-foreground font-medium">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              AI-Powered <span className="text-gradient">Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make smarter crypto investment decisions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) =>
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group">
              
                <div className="glass rounded-2xl p-6 h-full transition-all duration-300 hover:bg-white/10 gradient-border">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with AI-powered crypto analysis in three simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) =>
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative group">
              
                <div className="glass rounded-2xl p-8 h-full transition-all duration-300 hover:bg-white/10 gradient-border">
                  <div className="text-6xl font-bold text-gradient opacity-30 mb-4">{step.step}</div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 &&
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
              }
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Real-Time AI{" "}
                <span className="text-gradient">Trading Signals</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get instant buy, sell, and hold recommendations backed by advanced 
                machine learning analysis of market trends and patterns.
              </p>

              <div className="space-y-4 mb-8">
                {[
                "Entry and exit price recommendations",
                "Risk/reward ratio analysis",
                "Stop-loss and take-profit levels",
                "Confidence scores for every signal"].
                map((feature, index) =>
                <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="button-gradient"
                onClick={() => navigate('/markets')}>
                
                <TrendingUp className="mr-2 h-5 w-5" />
                View Trading Signals
              </Button>
            </motion.div>

            {/* Signal Card Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative">
              
              <div className="glass rounded-2xl p-8 glow-primary">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F7931A] flex items-center justify-center">
                      <span className="text-white font-bold">BTC</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Bitcoin</h3>
                      <p className="text-sm text-muted-foreground">BTC/USD</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 font-bold">
                    BUY
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Entry Range</div>
                    <div className="font-bold">$95,000 - $97,000</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Stop Loss</div>
                    <div className="font-bold text-red-400">$92,500</div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-muted-foreground mb-2">Take Profit Targets</div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm">$100,000</span>
                    <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm">$105,000</span>
                    <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm">$110,000</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Signal Strength</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-primary to-accent" />
                      </div>
                      <span className="text-sm font-bold">8/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Risk/Reward</span>
                    <div className="font-bold text-primary">1:3.5</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-card/30">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by <span className="text-gradient">Traders</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users say about our AI-powered crypto analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) =>
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-6">
              
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) =>
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                )}
                </div>
                <p className="text-lg mb-6 text-muted-foreground">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple <span className="text-gradient">Pricing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start for free, upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8">
              
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <div className="text-4xl font-bold mb-6">/ 150 credits<span className="text-lg text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {["Basic market data", "5 AI queries/day", "Portfolio tracking", "Email alerts"].map((feature, i) =>
                <li key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                )}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/home')}>
                Get Started
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 glow-primary relative">
              
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">$25/ 150 Credits<span className="text-lg text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {["Everything in Free", "Unlimited AI queries", "Trading signals", "Priority support", "Advanced analytics"].map((feature, i) =>
                <li key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                )}
              </ul>
              <Button className="w-full button-gradient" onClick={() => navigate('/home')}>
                Start Free Trial
              </Button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8">
              
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold mb-6">Custom</div>
              <ul className="space-y-3 mb-8">
                {["Everything in Pro", "Custom AI models", "API access", "Dedicated support", "SLA guarantee"].map((feature, i) =>
                <li key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                )}
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </motion.div>
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
            className="text-center mb-16">
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) =>
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass rounded-xl px-6 border-none">
                
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Trade <span className="text-gradient">Smarter?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of traders using AI to make better crypto investment decisions.
              </p>
              <Button
                size="lg"
                className="button-gradient text-lg px-10 py-6 h-auto"
                onClick={() => navigate('/home')}>
                
                <Bot className="mr-2 h-5 w-5" />
                Start AI Analysis Free
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;