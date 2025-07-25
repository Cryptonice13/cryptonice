"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";

const testimonials = [
  {
    name: "Maria Santos",
    role: "Small Business Owner",
    image: "https://avatars.githubusercontent.com/u/1234567?v=4",
    content: "This platform helped me secure funding for my textile business when banks wouldn't lend to me. The transparent process and fair rates made all the difference."
  },
  {
    name: "David Kim",
    role: "Impact Investor",
    image: "https://avatars.githubusercontent.com/u/2345678?v=4",
    content: "I've funded over 50 micro-loans through this platform. The ability to directly see the impact of my investments while earning returns is incredibly rewarding."
  },
  {
    name: "Priya Patel",
    role: "Agricultural Entrepreneur",
    image: "https://avatars.githubusercontent.com/u/3456789?v=4",
    content: "The micro-loan I received allowed me to expand my organic farm. The smart contract system gave both me and my lenders confidence in the process."
  },
  {
    name: "Robert Anderson",
    role: "Retirement Investor",
    image: "https://avatars.githubusercontent.com/u/4567890?v=4",
    content: "The platform's risk assessment tools help me make informed lending decisions. I'm earning steady returns while supporting entrepreneurs worldwide."
  },
  {
    name: "Chen Wei",
    role: "Tech Entrepreneur",
    image: "https://avatars.githubusercontent.com/u/5678901?v=4",
    content: "The decentralized nature and smart contract automation eliminate traditional banking barriers. It's exactly what financial inclusion needed."
  },
  {
    name: "Amanda Foster",
    role: "Social Impact Fund",
    image: "https://avatars.githubusercontent.com/u/6789012?v=4",
    content: "Our fund has deployed millions through this platform. The transparency and real-time tracking allow us to measure impact more effectively than ever."
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 overflow-hidden bg-black">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-normal mb-4">Trusted by Borrowers & Lenders</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands creating positive impact through microfinance
          </p>
        </motion.div>

        <div className="relative flex flex-col antialiased">
          <div className="relative flex overflow-hidden py-4">
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-1`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-2`} className="w-[400px] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;