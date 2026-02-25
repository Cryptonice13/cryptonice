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

