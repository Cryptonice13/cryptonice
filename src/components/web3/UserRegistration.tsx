import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type UserRole = "1" | "2"; // 1 = Borrower, 2 = Lender

export const UserRegistration = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    role: "1" as UserRole,
    name: "",
    metadataURI: ""
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      // This is a mock implementation - replace with actual smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      
      toast({
        title: "Registration Successful",
        description: "Your profile has been registered on the blockchain!",
      });
      
      setIsRegistered(true);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error?.message || "Failed to register user",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "1": return "Borrower";
      case "2": return "Lender";
      default: return "None";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "1": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "2": return "bg-green-500/10 text-green-400 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (!isConnected || !address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#111] border border-white/10">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <p className="text-gray-400">Please connect your wallet to continue</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show profile if user is registered
  if (isRegistered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#111] border border-green-500/20 hover:border-green-500/50 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Profile Registered
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your profile is registered on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Name:</span>
              <span className="text-white font-medium">{formData.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Role:</span>
              <Badge className={getRoleColor(formData.role)}>
                {formData.role === "1" ? <User className="w-3 h-3 mr-1" /> : <Building className="w-3 h-3 mr-1" />}
                {getRoleName(formData.role)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Wallet:</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </Badge>
            </div>
            <Button
              onClick={() => setIsRegistered(false)}
              variant="outline"
              className="w-full border-green-500/20 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show registration form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card className="bg-[#111] border border-white/10 hover:border-green-500/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Register Profile
          </CardTitle>
          <CardDescription className="text-gray-400">
            Register your profile on the blockchain to start using the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white">Select Your Role</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border border-white/20 rounded-lg p-3 hover:border-blue-500/50 transition-colors">
                  <RadioGroupItem value="1" id="borrower" className="border-white/40" />
                  <Label htmlFor="borrower" className="text-white cursor-pointer flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Borrower
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-white/20 rounded-lg p-3 hover:border-green-500/50 transition-colors">
                  <RadioGroupItem value="2" id="lender" className="border-white/40" />
                  <Label htmlFor="lender" className="text-white cursor-pointer flex items-center gap-2">
                    <Building className="w-4 h-4 text-green-400" />
                    Lender
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata" className="text-white">Metadata URI (Optional)</Label>
              <Input
                id="metadata"
                type="url"
                placeholder="https://ipfs.io/ipfs/..."
                value={formData.metadataURI}
                onChange={(e) => setFormData({ ...formData, metadataURI: e.target.value })}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
            >
              {isRegistering ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : (
                "Register Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};