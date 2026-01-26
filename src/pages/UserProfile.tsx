import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Wallet, 
  Copy, 
  Edit, 
  Save, 
  X, 
  ExternalLink,
  Calendar,
  Building,
  CheckCircle,
  Settings
} from 'lucide-react';

interface UserProfileData {
  name: string;
  role: string;
  walletAddress?: string;
  metadataURI?: string;
  dateRegistered?: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    metadataURI: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [address, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Mock implementation - replace with actual smart contract call
      // const profile = await contract.getUserProfile(address);
      
      // For now, simulate fetching profile data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock profile data - replace with actual contract data
      const mockProfile: UserProfileData = {
        name: user?.user_metadata?.name || 'John Doe',
        role: '1', // 1 = Borrower, 2 = Lender
        walletAddress: address,
        metadataURI: '',
        dateRegistered: '2024-01-15'
      };
      
      setProfile(mockProfile);
      setEditForm({
        name: mockProfile.name,
        metadataURI: mockProfile.metadataURI || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If no profile exists, redirect to register
      if (!isConnected || !address) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdating(true);
      
      // Mock implementation - replace with actual smart contract call
      // await contract.updateProfile(editForm.name, editForm.metadataURI);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        metadataURI: editForm.metadataURI
      } : null);
      
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to register your profile first.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/home')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Profile Information
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </CardTitle>
                    <CardDescription>
                      Your registered blockchain profile
                    </CardDescription>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metadata">Metadata URI (Optional)</Label>
                    <Input
                      id="metadata"
                      value={editForm.metadataURI}
                      onChange={(e) => setEditForm({ ...editForm, metadataURI: e.target.value })}
                      placeholder="https://ipfs.io/ipfs/..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          name: profile.name,
                          metadataURI: profile.metadataURI || ''
                        });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Name</Label>
                      <p className="text-lg font-medium">{profile.name}</p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Role</Label>
                      <div className="mt-1">
                        <Badge className={getRoleColor(profile.role)}>
                          {profile.role === "1" ? (
                            <User className="w-3 h-3 mr-1" />
                          ) : (
                            <Building className="w-3 h-3 mr-1" />
                          )}
                          {getRoleName(profile.role)}
                        </Badge>
                      </div>
                    </div>

                    {profile.walletAddress && (
                      <div className="md:col-span-2">
                        <Label className="text-sm text-muted-foreground">Wallet Address</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {`${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(profile.walletAddress!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <a
                            href={`https://etherscan.io/address/${profile.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.dateRegistered && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Member Since</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(profile.dateRegistered).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {profile.metadataURI && (
                      <div className="md:col-span-2">
                        <Label className="text-sm text-muted-foreground">Metadata URI</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                            {profile.metadataURI}
                          </span>
                          <a
                            href={profile.metadataURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Connection Status */}
        {isConnected && address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Wallet</p>
                  <p className="font-mono text-sm">{`${address.slice(0, 8)}...${address.slice(-6)}`}</p>
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfile;