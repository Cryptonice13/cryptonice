import { useState, useCallback, useEffect } from 'react';
import { useContract } from './useContract';
import { useWalletStore } from '@/state/walletStore';
import { parseEther, formatEther } from 'ethers';
import { NFT_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ADDRESS } from '@/config/contracts';
import NFTAbi from '@/contracts/abis/NFT.json';
import MarketplaceAbi from '@/contracts/abis/NFTMarketplace.json';

export interface NFTData {
  tokenId: string;
  owner: string;
  tokenURI: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  isListed?: boolean;
}

export const useNFT = () => {
  const { address, isConnected } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [myNFTs, setMyNFTs] = useState<NFTData[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTData[]>([]);

  const nftContract = useContract(NFT_CONTRACT_ADDRESS, NFTAbi);
  const marketplaceContract = useContract(MARKETPLACE_CONTRACT_ADDRESS, MarketplaceAbi);

  // Mint NFT with metadata
  const mintNFT = useCallback(async (
    name: string,
    description: string,
    imageFile: File
  ) => {
    if (!nftContract || !address) {
      throw new Error('Contract or wallet not available');
    }

    setLoading(true);
    try {
      // In production, upload to IPFS
      // For now, create a mock metadata URI
      const metadata = {
        name,
        description,
        image: URL.createObjectURL(imageFile),
      };
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      const tx = await nftContract.mintNFT(address, tokenURI);
      await tx.wait();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [nftContract, address]);

  // List NFT for sale
  const listNFT = useCallback(async (tokenId: string, priceInEth: string) => {
    if (!nftContract || !marketplaceContract || !address) {
      throw new Error('Contract or wallet not available');
    }

    setLoading(true);
    try {
      // First approve marketplace to transfer NFT
      const approveTx = await nftContract.approve(MARKETPLACE_CONTRACT_ADDRESS, tokenId);
      await approveTx.wait();

      // Then list the NFT
      const priceInWei = parseEther(priceInEth);
      const listTx = await marketplaceContract.listNFT(NFT_CONTRACT_ADDRESS, tokenId, priceInWei);
      await listTx.wait();

      return listTx;
    } finally {
      setLoading(false);
    }
  }, [nftContract, marketplaceContract, address]);

  // Buy NFT
  const buyNFT = useCallback(async (tokenId: string, priceInEth: string) => {
    if (!marketplaceContract) {
      throw new Error('Marketplace contract not available');
    }

    setLoading(true);
    try {
      const priceInWei = parseEther(priceInEth);
      const tx = await marketplaceContract.buyNFT(NFT_CONTRACT_ADDRESS, tokenId, {
        value: priceInWei,
      });
      await tx.wait();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [marketplaceContract]);

  // Cancel listing
  const cancelListing = useCallback(async (tokenId: string) => {
    if (!marketplaceContract) {
      throw new Error('Marketplace contract not available');
    }

    setLoading(true);
    try {
      const tx = await marketplaceContract.cancelListing(NFT_CONTRACT_ADDRESS, tokenId);
      await tx.wait();

      return tx;
    } finally {
      setLoading(false);
    }
  }, [marketplaceContract]);

  // Fetch my NFTs
  const fetchMyNFTs = useCallback(async () => {
    if (!nftContract || !marketplaceContract || !address) return;

    setLoading(true);
    try {
      const totalSupply = await nftContract.totalSupply();
      const nfts: NFTData[] = [];

      for (let i = 1; i <= totalSupply; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === address.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(i);
            const listing = await marketplaceContract.getListing(NFT_CONTRACT_ADDRESS, i);
            
            // Parse metadata
            let metadata;
            if (tokenURI.startsWith('data:application/json')) {
              const json = tokenURI.split(',')[1];
              metadata = JSON.parse(atob(json));
            } else {
              // Fetch from IPFS or HTTP
              const response = await fetch(tokenURI);
              metadata = await response.json();
            }

            nfts.push({
              tokenId: i.toString(),
              owner,
              tokenURI,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              price: listing.isActive ? formatEther(listing.price) : undefined,
              isListed: listing.isActive,
            });
          }
        } catch (error) {
          console.error(`Error fetching NFT ${i}:`, error);
        }
      }

      setMyNFTs(nfts);
    } finally {
      setLoading(false);
    }
  }, [nftContract, marketplaceContract, address]);

  // Fetch all listed NFTs
  const fetchListedNFTs = useCallback(async () => {
    if (!nftContract || !marketplaceContract) return;

    setLoading(true);
    try {
      const totalSupply = await nftContract.totalSupply();
      const nfts: NFTData[] = [];

      for (let i = 1; i <= totalSupply; i++) {
        try {
          const listing = await marketplaceContract.getListing(NFT_CONTRACT_ADDRESS, i);
          
          if (listing.isActive) {
            const owner = await nftContract.ownerOf(i);
            const tokenURI = await nftContract.tokenURI(i);
            
            // Parse metadata
            let metadata;
            if (tokenURI.startsWith('data:application/json')) {
              const json = tokenURI.split(',')[1];
              metadata = JSON.parse(atob(json));
            } else {
              const response = await fetch(tokenURI);
              metadata = await response.json();
            }

            nfts.push({
              tokenId: i.toString(),
              owner,
              tokenURI,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              price: formatEther(listing.price),
              isListed: true,
            });
          }
        } catch (error) {
          console.error(`Error fetching NFT ${i}:`, error);
        }
      }

      setListedNFTs(nfts);
    } finally {
      setLoading(false);
    }
  }, [nftContract, marketplaceContract]);

  // Auto-fetch on mount and when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchMyNFTs();
      fetchListedNFTs();
    }
  }, [isConnected, address, fetchMyNFTs, fetchListedNFTs]);

  return {
    loading,
    myNFTs,
    listedNFTs,
    mintNFT,
    listNFT,
    buyNFT,
    cancelListing,
    fetchMyNFTs,
    fetchListedNFTs,
  };
};
