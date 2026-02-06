import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  User,
  Mail,
  Globe,
  Clock,
  RefreshCw
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [walletConnecting, setWalletConnecting] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    browser: true
  });
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      
      // Disconnect wallet if connected
      if (isConnected) {
        disconnect();
      }
      
      // Sign out from Supabase
      await signOut();
      
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
  };

  const getLoginMethod = () => {
    if (isConnected && address) return 'Wallet';
    if (user?.app_metadata?.provider === 'google') return 'Google';
    if (user?.email) return 'Email';
    return 'Unknown';
  };

  const getLastLoginTime = () => {
    if (user?.last_sign_in_at) {
      return new Date(user.last_sign_in_at).toLocaleString();
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your account preferences and security</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/home')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Loan updates and reminders</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Critical alerts only</p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Browser Notifications</p>
                    <p className="text-sm text-muted-foreground">Real-time updates</p>
                  </div>
                  <Switch
                    checked={notifications.browser}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, browser: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Account security information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Last Login</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {getLastLoginTime()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Login Method</span>
                  </div>
                  <Badge variant="secondary">
                    {getLoginMethod()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Connected Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>
                  {isConnected ? 'Your connected wallet information' : 'No wallet connected'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected && address ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Wallet Address</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {`${address.slice(0, 6)}...${address.slice(-4)}`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(address)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <a
                          href={`https://etherscan.io/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                        Connected
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network</span>
                      <Badge variant="outline">Ethereum</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnect()}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reconnect Wallet
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Wallet className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No wallet connected to your account
                    </p>
                    <Button
                      variant="outline"
                      disabled={walletConnecting}
                      onClick={async () => {
                        setWalletConnecting(true);
                        try {
                          await connectAsync({ connector: injected() });
                          toast({
                            title: 'Wallet Connected',
                            description: 'Your wallet has been connected successfully.',
                          });
                        } catch (error) {
                          console.error('Wallet connection error:', error);
                          toast({
                            title: 'Connection Failed',
                            description: (error as Error)?.message || 'Failed to connect wallet. Please try again.',
                            variant: 'destructive',
                          });
                        } finally {
                          setWalletConnecting(false);
                        }
                      }}
                    >
                      {walletConnecting ? (
                        <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Wallet className="w-4 h-4 mr-2" />
                      )}
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.email && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Email</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Account ID</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {user?.id?.slice(0, 8)}...
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account Created</span>
                  <span className="text-sm text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400">Account Actions</CardTitle>
              <CardDescription>
                Actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing Out...
                  </div>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;