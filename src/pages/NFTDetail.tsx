import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWalletStore } from '@/state/walletStore';
import { useNFT } from '@/hooks/useNFT';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Heart,
  Share2,
  Clock,
  DollarSign,
  User,
  ExternalLink,
  Tag as TagIcon,
  Loader2,
  History,
  ChevronLeft,
  Copy,
  Check,
} from 'lucide-react';

const NFTDetail = () => {
  const navigate = useNavigate();
  const { tokenId } = useParams<{ tokenId: string }>();
  const { toast } = useToast();
  const { address, isConnected } = useWalletStore();
  const { loading, myNFTs, listedNFTs, buyNFT, fetchMyNFTs, fetchListedNFTs } = useNFT();
  
  const [bidAmount, setBidAmount] = useState('');
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Mock data for demo - in production, fetch from blockchain
  const [nft, setNft] = useState<any>(null);
  
  useEffect(() => {
    // Fetch NFT details
    const allNFTs = [...myNFTs, ...listedNFTs];
    const foundNFT = allNFTs.find(n => n.tokenId === tokenId);
    if (foundNFT) {
      setNft(foundNFT);
    }
  }, [tokenId, myNFTs, listedNFTs]);

  const handleBuyNFT = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to buy NFTs',
        variant: 'destructive'
      });
      return;
    }

    if (!nft?.price) return;

    try {
      await buyNFT(nft.tokenId, nft.price);
      
      toast({
        title: 'NFT Purchased!',
        description: 'The NFT has been transferred to your wallet'
      });

      await fetchListedNFTs();
      await fetchMyNFTs();
      navigate('/nft-marketplace');
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to buy NFT',
        variant: 'destructive'
      });
    }
  };

  const handlePlaceBid = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to place bids',
        variant: 'destructive'
      });
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast({
        title: 'Invalid Bid',
        description: 'Please enter a valid bid amount',
        variant: 'destructive'
      });
      return;
    }

    // Mock bid placement - implement actual auction logic
    toast({
      title: 'Bid Placed!',
      description: `Your bid of ${bidAmount} ETH has been placed`,
    });
    setBidAmount('');
  };

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Address copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: nft?.name || 'NFT',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied!',
        description: 'Share link copied to clipboard',
      });
    }
  };

  if (!nft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOwner = nft.owner?.toLowerCase() === address?.toLowerCase();
  const isListed = listedNFTs.some(n => n.tokenId === tokenId);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/nft-marketplace">Marketplace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{nft.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Media Viewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </motion.div>

          {/* Right Column - NFT Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Title & Actions */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">{nft.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLiked(!liked)}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sale Status Badge */}
              {isListed && (
                <Badge variant="default" className="mb-4">
                  Listed for Sale
                </Badge>
              )}
              {isOwner && !isListed && (
                <Badge variant="secondary" className="mb-4">
                  Owned
                </Badge>
              )}
            </div>

            <Separator />

            {/* Price / Auction Section */}
            {isListed && nft.price && (
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Fixed Price</span>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <span className="text-4xl font-bold">{nft.price}</span>
                      <span className="text-2xl text-muted-foreground">ETH</span>
                    </div>

                    {!isOwner && (
                      <Button 
                        onClick={handleBuyNFT}
                        size="lg"
                        className="w-full"
                        disabled={loading || !isConnected}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : !isConnected ? (
                          'Connect Wallet to Buy'
                        ) : (
                          'Buy Now'
                        )}
                      </Button>
                    )}

                    {isOwner && (
                      <div className="text-sm text-muted-foreground text-center">
                        You own this NFT
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Auction Section (Mock) */}
            {false && ( // Set to true to show auction UI
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Auction ends in: 05:23:12</span>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">Highest Bid:</span>
                      <span className="text-3xl font-bold">1.6 ETH</span>
                      <span className="text-sm text-muted-foreground">($3,200)</span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter bid amount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        type="number"
                        step="0.01"
                      />
                      <Button onClick={handlePlaceBid} disabled={loading}>
                        Place Bid
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {nft.description || 'No description provided.'}
              </p>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  Digital Art
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  Collectible
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  NFT
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Blockchain Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Blockchain Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chain</span>
                  <Badge variant="outline">Ethereum</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token Standard</span>
                  <Badge variant="outline">ERC-721</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token ID</span>
                  <span className="text-sm font-mono">{nft.tokenId}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Contract</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyAddress(nft.owner)}
                    >
                      {copied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      asChild
                    >
                      <a
                        href={`https://etherscan.io/address/${nft.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* History / Provenance */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <History className="w-5 h-5" />
                History
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Minted</span>
                      <span className="text-xs text-muted-foreground">Jan 2025</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    </p>
                  </div>
                </div>

                {isListed && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Listed</span>
                        <span className="text-xs text-muted-foreground">Now</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        For {nft.price} ETH
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default NFTDetail;
