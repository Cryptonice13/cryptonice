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
          onClick={() => navigate('/nft-marketplace')}
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
          <span className="text-gradient font-medium">NFT Experience</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-lg text-gray-400"
        >
          Find the perfect plan whether you're collecting or creating NFTs on our marketplace
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingTier
          name="NFT Collector"
          price="2.5%"
          description="Perfect for discovering and collecting unique NFTs"
          features={[
            "Buy NFTs instantly",
            "Secure wallet integration",
            "Browse marketplace",
            "Community access"
          ]}
        />
        <PricingTier
          name="NFT Creator"
          price="5%"
          description="Start creating and selling your digital products"
          features={[
            "Mint unlimited NFTs",
            "List items for sale",
            "Creator dashboard",
            "Royalty management",
            "Marketing tools"
          ]}
          isPopular
        />
        <PricingTier
          name="Enterprise"
          price="Custom"
          description="Large-scale NFT solutions for brands and organizations"
          features={[
            "Custom marketplace",
            "Bulk minting tools",
            "Advanced analytics",
            "White-label solutions",
            "Dedicated support",
            "API access"
          ]}
        />
      </div>
    </section>
  );
};