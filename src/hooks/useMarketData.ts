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

// Fallback data in case API fails
const FALLBACK_MARKET_DATA: CryptoAsset[] = [
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
    logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
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
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
];

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export function useMarketData() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const formattedAssets: CryptoAsset[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        priceChange24h: coin.price_change_percentage_24h || 0,
        priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        circulatingSupply: coin.circulating_supply || 0,
        sparkline: coin.sparkline_in_7d?.price?.slice(-24) || [],
        logo: coin.image || `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`,
      }));

      setAssets(formattedAssets);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      
      // Use fallback data if no assets loaded yet
      if (assets.length === 0) {
        setAssets(FALLBACK_MARKET_DATA);
      }
    } finally {
      setIsLoading(false);
    }
  }, [assets.length]);

  useEffect(() => {
    fetchMarketData();
    
    // Refresh every 60 seconds (CoinGecko free tier rate limit)
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getAssetBySymbol = useCallback((symbol: string) => {
    return assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
  }, [assets]);

  return { assets, isLoading, error, refresh: fetchMarketData, getAssetBySymbol, lastUpdated };
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
