import { useState, useEffect, useCallback } from 'react';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  sparkline: number[];
  logo: string;
}

export interface WatchlistItem extends CryptoAsset {
  alertPrice?: number;
  alertType?: 'above' | 'below';
}

// Mock market data - In production, this would fetch from CoinGecko, CoinMarketCap, etc.
const MOCK_MARKET_DATA: CryptoAsset[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 97500,
    priceChange24h: 2.34,
    priceChange7d: 5.67,
    marketCap: 1920000000000,
    volume24h: 45000000000,
    circulatingSupply: 19600000,
    sparkline: [95000, 95500, 96000, 95800, 96500, 97000, 97500],
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3450,
    priceChange24h: 1.89,
    priceChange7d: 4.23,
    marketCap: 415000000000,
    volume24h: 18000000000,
    circulatingSupply: 120000000,
    sparkline: [3300, 3350, 3400, 3380, 3420, 3440, 3450],
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 198,
    priceChange24h: 5.67,
    priceChange7d: 12.34,
    marketCap: 92000000000,
    volume24h: 5500000000,
    circulatingSupply: 465000000,
    sparkline: [175, 180, 185, 188, 192, 195, 198],
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 1.12,
    priceChange24h: 3.21,
    priceChange7d: 8.45,
    marketCap: 39000000000,
    volume24h: 1200000000,
    circulatingSupply: 35000000000,
    sparkline: [1.0, 1.02, 1.05, 1.08, 1.10, 1.11, 1.12],
    logo: 'https://cryptologos.cc/logos/cardano-ada-logo.svg',
  },
  {
    id: 'avalanche',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 42.5,
    priceChange24h: -1.23,
    priceChange7d: 3.56,
    marketCap: 17000000000,
    volume24h: 890000000,
    circulatingSupply: 400000000,
    sparkline: [44, 43.5, 43, 42.8, 42.5, 42.3, 42.5],
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg',
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    price: 8.95,
    priceChange24h: 2.15,
    priceChange7d: 6.78,
    marketCap: 12500000000,
    volume24h: 450000000,
    circulatingSupply: 1400000000,
    sparkline: [8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.95],
    logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg',
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    price: 24.8,
    priceChange24h: 4.56,
    priceChange7d: 9.12,
    marketCap: 15000000000,
    volume24h: 780000000,
    circulatingSupply: 600000000,
    sparkline: [22.5, 23, 23.5, 24, 24.3, 24.6, 24.8],
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
  },
  {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    price: 14.2,
    priceChange24h: 1.78,
    priceChange7d: 5.43,
    marketCap: 10700000000,
    volume24h: 320000000,
    circulatingSupply: 750000000,
    sparkline: [13.5, 13.7, 13.9, 14.0, 14.1, 14.15, 14.2],
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg',
  },
];

export function useMarketData() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add some randomness to simulate real-time updates
      const updatedData = MOCK_MARKET_DATA.map(asset => ({
        ...asset,
        price: asset.price * (1 + (Math.random() - 0.5) * 0.02),
        priceChange24h: asset.priceChange24h + (Math.random() - 0.5) * 0.5,
      }));
      
      setAssets(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const getAssetBySymbol = useCallback((symbol: string) => {
    return assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
  }, [assets]);

  return { assets, isLoading, error, refresh: fetchMarketData, getAssetBySymbol };
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('crypto-watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('crypto-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback((asset: CryptoAsset) => {
    setWatchlist(prev => {
      if (prev.some(item => item.id === asset.id)) return prev;
      return [...prev, asset];
    });
  }, []);

  const removeFromWatchlist = useCallback((assetId: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== assetId));
  }, []);

  const setAlert = useCallback((assetId: string, price: number, type: 'above' | 'below') => {
    setWatchlist(prev =>
      prev.map(item =>
        item.id === assetId
          ? { ...item, alertPrice: price, alertType: type }
          : item
      )
    );
  }, []);

  const isInWatchlist = useCallback((assetId: string) => {
    return watchlist.some(item => item.id === assetId);
  }, [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, setAlert, isInWatchlist };
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<{ asset: CryptoAsset; amount: number; avgBuyPrice: number }[]>(() => {
    const saved = localStorage.getItem('crypto-portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('crypto-portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const addPosition = useCallback((asset: CryptoAsset, amount: number, buyPrice: number) => {
    setPortfolio(prev => {
      const existing = prev.find(p => p.asset.id === asset.id);
      if (existing) {
        const newAmount = existing.amount + amount;
        const newAvgPrice = (existing.avgBuyPrice * existing.amount + buyPrice * amount) / newAmount;
        return prev.map(p =>
          p.asset.id === asset.id
            ? { ...p, amount: newAmount, avgBuyPrice: newAvgPrice }
            : p
        );
      }
      return [...prev, { asset, amount, avgBuyPrice: buyPrice }];
    });
  }, []);

  const removePosition = useCallback((assetId: string) => {
    setPortfolio(prev => prev.filter(p => p.asset.id !== assetId));
  }, []);

  const updatePosition = useCallback((assetId: string, amount: number, avgBuyPrice: number) => {
    setPortfolio(prev =>
      prev.map(p =>
        p.asset.id === assetId
          ? { ...p, amount, avgBuyPrice }
          : p
      )
    );
  }, []);

  const getTotalValue = useCallback((currentPrices: Map<string, number>) => {
    return portfolio.reduce((total, p) => {
      const currentPrice = currentPrices.get(p.asset.id) || p.asset.price;
      return total + p.amount * currentPrice;
    }, 0);
  }, [portfolio]);

  const getTotalPnL = useCallback((currentPrices: Map<string, number>) => {
    return portfolio.reduce((total, p) => {
      const currentPrice = currentPrices.get(p.asset.id) || p.asset.price;
      const currentValue = p.amount * currentPrice;
      const costBasis = p.amount * p.avgBuyPrice;
      return total + (currentValue - costBasis);
    }, 0);
  }, [portfolio]);

  return { portfolio, addPosition, removePosition, updatePosition, getTotalValue, getTotalPnL };
}
