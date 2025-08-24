import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { useNavigate } from "react-router-dom";

const PricingTier = ({
  name,
  price,
  description,
  features,
  isPopular,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}) => {
  const navigate = useNavigate();
  
  return (
    <CardSpotlight className={`h-full ${isPopular ? "border-primary" : "border-white/10"} border-2`}>
      <div className="relative h-full p-6 flex flex-col">
        {isPopular && (
          <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 w-fit mb-4">
            Most Popular
          </span>
        )}
        <h3 className="text-xl font-medium mb-2">{name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold">{price}</span>
          {price !== "Custom" && !price.includes("%") && <span className="text-gray-400">/month</span>}
          {price.includes("%") && <span className="text-gray-400"> APR</span>}
        </div>
        <p className="text-gray-400 mb-6">{description}</p>
        <ul className="space-y-3 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className="button-gradient w-full"
          onClick={() => navigate('/home')}
        >
          Get Started
        </Button>
      </div>
    </CardSpotlight>
  );
};

export const PricingSection = () => {
  return (
    <section className="container px-4 py-24">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-normal mb-6"
        >
          Choose Your{" "}
          <span className="text-gradient font-medium">Lending Experience</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-400"
        >
          Find the perfect plan whether you're borrowing or lending with transparent rates
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingTier
          name="Basic Borrower"
          price="3-8%"
          description="Perfect for first-time borrowers building credit"
          features={[
            "Loans up to $1,000",
            "Flexible repayment terms",
            "Build on-chain reputation",
            "Community support"
          ]}
        />
        <PricingTier
          name="Verified Lender"
          price="5-12%"
          description="Start earning passive income through micro-lending"
          features={[
            "Diversified loan portfolio",
            "Automated investment tools",
            "Detailed borrower profiles",
            "Risk assessment tools",
            "Social impact tracking"
          ]}
          isPopular
        />
        <PricingTier
          name="Institutional"
          price="Custom"
          description="Large-scale lending solutions for organizations"
          features={[
            "Bulk lending programs",
            "Custom risk parameters",
            "Dedicated fund management",
            "Advanced analytics",
            "White-label solutions",
            "24/7 priority support"
          ]}
        />
      </div>
    </section>
  );
};