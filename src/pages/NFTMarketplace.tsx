import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWalletStore } from '@/state/walletStore';
import {
  Image as ImageIcon,
  Wallet,
  ShoppingCart,
  Tag,
  Upload,
  DollarSign,
  User,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  owner: string;
  isListed: boolean;
}

const mockNFTs: NFT[] = [
  {
    id: '1',
    name: 'Crypto Punk #1234',
    description: 'Rare crypto collectible with unique traits',
    image: '/lovable-uploads/0dbe1b75-2c74-4ff8-ba55-4be4d74abe72.png',
    price: '2.5',
    owner: '0x1234...5678',
    isListed: true
  },
  {
    id: '2',
    name: 'Bored Ape #5678',
    description: 'Premium NFT with exclusive benefits',
    image: '/lovable-uploads/1e2a48dc-059b-4919-a1ed-44685d771a32.png',
    price: '5.0',
    owner: '0xabcd...efgh',
    isListed: true
  },
  {
    id: '3',
    name: 'Doodle #9999',
    description: 'Artistic NFT from renowned collection',
    image: '/lovable-uploads/21f3edfb-62b5-4e35-9d03-7339d803b980.png',
    price: '1.8',
    owner: '0x9876...4321',
    isListed: true
  }
];

const NFTMarketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address, isConnected } = useWalletStore();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [nfts] = useState<NFT[]>(mockNFTs);
  const [myNFTs] = useState<NFT[]>([
    { ...mockNFTs[0], owner: address || '0x0000...0000', isListed: false }
  ]);

  // Mint NFT form state
  const [mintForm, setMintForm] = useState({
    name: '',
    description: '',
    image: null as File | null
  });

  // Placeholder contract functions
  const handleMintNFT = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to mint NFTs',
        variant: 'destructive'
      });
      return;
    }

    if (!mintForm.name || !mintForm.description || !mintForm.image) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    // Placeholder for contract interaction
    toast({
      title: 'Minting NFT',
      description: 'Transaction submitted. This is a placeholder for contract integration.'
    });

    // Reset form
    setMintForm({ name: '', description: '', image: null });
  };

  const handleBuyNFT = async (nftId: string) => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to buy NFTs',
        variant: 'destructive'
      });
      return;
    }

    // Placeholder for contract interaction
    toast({
      title: 'Purchasing NFT',
      description: `Buying NFT #${nftId}. This is a placeholder for contract integration.`
    });
  };

  const handleListNFT = async (nftId: string, price: string) => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to list NFTs',
        variant: 'destructive'
      });
      return;
    }

    // Placeholder for contract interaction
    toast({
      title: 'Listing NFT',
      description: `Listing NFT #${nftId} for ${price} ETH. This is a placeholder for contract integration.`
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMintForm({ ...mintForm, image: file });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                NFT Marketplace
              </h1>
              <p className="text-muted-foreground">
                Mint, buy, and sell unique digital assets on the blockchain
              </p>
            </div>
            
            {isConnected ? (
              <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
                <Wallet className="w-4 h-4" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Badge>
            ) : (
              <Button variant="default" onClick={() => useWalletStore.getState().connect()}>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="mint" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Mint NFT
            </TabsTrigger>
            <TabsTrigger value="my-nfts" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              My NFTs
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                  <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                        {nft.isListed && (
                          <Badge className="absolute top-2 right-2 bg-primary">
                            For Sale
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-2">{nft.name}</CardTitle>
                      <CardDescription className="text-sm mb-4">
                        {nft.description}
                      </CardDescription>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          {nft.owner}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          <span className="text-xl font-bold">{nft.price} ETH</span>
                        </div>
                        
                        {nft.isListed && (
                          <Button 
                            onClick={() => handleBuyNFT(nft.id)}
                            size="sm"
                          >
                            Buy Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Mint NFT Tab */}
          <TabsContent value="mint">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Mint Your NFT
                  </CardTitle>
                  <CardDescription>
                    Create and mint your unique digital asset
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nft-name">NFT Name</Label>
                    <Input
                      id="nft-name"
                      placeholder="Enter NFT name"
                      value={mintForm.name}
                      onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nft-description">Description</Label>
                    <Textarea
                      id="nft-description"
                      placeholder="Describe your NFT"
                      rows={4}
                      value={mintForm.description}
                      onChange={(e) => setMintForm({ ...mintForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nft-image">Upload Image</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        id="nft-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="nft-image" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {mintForm.image ? mintForm.image.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  <Button 
                    onClick={handleMintNFT} 
                    className="w-full" 
                    size="lg"
                    disabled={!isConnected}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isConnected ? 'Mint NFT' : 'Connect Wallet to Mint'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* My NFTs Tab */}
          <TabsContent value="my-nfts">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {!isConnected ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your wallet to view your NFT collection
                    </p>
                    <Button onClick={() => useWalletStore.getState().connect()}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </CardContent>
                </Card>
              ) : myNFTs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start by minting your first NFT or buying from the marketplace
                    </p>
                    <Button onClick={() => setActiveTab('mint')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Mint NFT
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myNFTs.map((nft) => (
                    <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="p-0">
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-2 right-2 bg-secondary">
                            Owned
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardTitle className="text-lg mb-2">{nft.name}</CardTitle>
                        <CardDescription className="text-sm mb-4">
                          {nft.description}
                        </CardDescription>
                        
                        {nft.isListed ? (
                          <div className="space-y-2">
                            <Badge variant="outline" className="w-full justify-center">
                              Listed for {nft.price} ETH
                            </Badge>
                            <Button variant="outline" className="w-full" size="sm">
                              Unlist
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleListNFT(nft.id, '1.5')}
                            className="w-full"
                            size="sm"
                          >
                            <Tag className="w-4 h-4 mr-2" />
                            List for Sale
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NFTMarketplace;
