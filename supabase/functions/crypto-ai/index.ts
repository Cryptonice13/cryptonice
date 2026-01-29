import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COINGECKO_API = "https://api.coingecko.com/api/v3";

interface MarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
}

async function fetchMarketData(symbols?: string[]): Promise<MarketData[]> {
  try {
    const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("CoinGecko API error:", response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (symbols && symbols.length > 0) {
      const symbolsLower = symbols.map(s => s.toLowerCase());
      return data.filter((coin: MarketData) => 
        symbolsLower.includes(coin.symbol.toLowerCase()) || 
        symbolsLower.includes(coin.id.toLowerCase())
      );
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    return [];
  }
}

async function fetchCoinDetails(coinId: string): Promise<any> {
  try {
    const url = `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("CoinGecko coin details error:", response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch coin details:", error);
    return null;
  }
}

function formatMarketDataForPrompt(data: MarketData[]): string {
  if (!data || data.length === 0) return "No real-time market data available.";
  
  return data.map(coin => 
    `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()} | 24h: ${coin.price_change_percentage_24h?.toFixed(2)}% | 7d: ${coin.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(coin.total_volume / 1e9).toFixed(2)}B | MCap: $${(coin.market_cap / 1e9).toFixed(2)}B | 24h High: $${coin.high_24h?.toLocaleString()} | 24h Low: $${coin.low_24h?.toLocaleString()}`
  ).join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${type} request...`);

    // Fetch real-time market data based on request type
    let marketData: MarketData[] = [];
    let coinDetails: any = null;
    
    if (type === "chat") {
      // For chat, get top 20 coins for general context
      marketData = (await fetchMarketData()).slice(0, 20);
      console.log(`Fetched ${marketData.length} coins for chat context`);
    } else if (type === "portfolio_analysis" && context?.length > 0) {
      // For portfolio analysis, get data for portfolio assets
      const symbols = context.map((item: any) => item.asset?.symbol || item.symbol).filter(Boolean);
      marketData = await fetchMarketData(symbols);
      console.log(`Fetched data for portfolio symbols: ${symbols.join(', ')}`);
    } else if ((type === "market_prediction" || type === "trading_signal") && context?.symbol) {
      // For specific coin analysis, get that coin's data plus market context
      const symbolMap: Record<string, string> = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
        'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2',
        'DOT': 'polkadot', 'MATIC': 'matic-network', 'LINK': 'chainlink', 'UNI': 'uniswap'
      };
      const coinId = symbolMap[context.symbol.toUpperCase()] || context.symbol.toLowerCase();
      
      marketData = await fetchMarketData([context.symbol]);
      coinDetails = await fetchCoinDetails(coinId);
      console.log(`Fetched data for ${context.symbol}: price = $${marketData[0]?.current_price}`);
    }

    const realTimeDataStr = formatMarketDataForPrompt(marketData);
    const timestamp = new Date().toISOString();

    let systemPrompt = "";

    switch (type) {
      case "chat":
        systemPrompt = `You are CryptoAI, an expert cryptocurrency analyst and advisor with access to REAL-TIME market data.

CURRENT MARKET DATA (as of ${timestamp}):
${realTimeDataStr}

You provide:
- Portfolio analysis and optimization suggestions based on CURRENT prices
- Market predictions based on technical and fundamental analysis using LIVE data
- Trading signals with entry/exit points based on CURRENT market conditions
- Risk assessment and management advice

IMPORTANT: Always reference the real-time data provided above in your analysis. Cite specific prices, percentage changes, and volumes when making recommendations. Be data-driven and provide actionable insights. When discussing predictions, always include disclaimers about market volatility. Format responses with clear sections using markdown.

${context ? `User's portfolio context: ${JSON.stringify(context)}` : ""}`;
        break;
      
      case "portfolio_analysis":
        systemPrompt = `You are a portfolio analyst AI with access to REAL-TIME market data.

CURRENT MARKET DATA (as of ${timestamp}):
${realTimeDataStr}

Analyze the user's crypto portfolio using the real-time prices above and provide:
1. Portfolio health score (1-100) - based on current market conditions
2. Diversification analysis - considering current correlations
3. Risk assessment (low/medium/high) - based on current volatility
4. Top 3 optimization suggestions - using current price levels
5. Potential concerns - based on recent price movements

Portfolio data: ${JSON.stringify(context)}

IMPORTANT: Use the ACTUAL current prices from the market data above, not the portfolio's stored prices.

Respond in JSON format with keys: healthScore, diversification, riskLevel, suggestions (array), concerns (array), summary (string).`;
        break;
      
      case "market_prediction":
        const coinData = marketData[0];
        const detailsStr = coinDetails ? `
Market Cap Rank: #${coinDetails.market_cap_rank}
All-Time High: $${coinDetails.market_data?.ath?.usd?.toLocaleString()} (${coinDetails.market_data?.ath_change_percentage?.usd?.toFixed(2)}% from ATH)
All-Time Low: $${coinDetails.market_data?.atl?.usd?.toLocaleString()}
Circulating Supply: ${coinDetails.market_data?.circulating_supply?.toLocaleString()}
Total Supply: ${coinDetails.market_data?.total_supply?.toLocaleString() || 'N/A'}
24h Trading Volume: $${coinDetails.market_data?.total_volume?.usd?.toLocaleString()}` : '';

        systemPrompt = `You are a crypto market analyst with access to REAL-TIME market data.

CURRENT MARKET DATA FOR ${context?.symbol || "BTC"} (as of ${timestamp}):
${coinData ? `
Current Price: $${coinData.current_price.toLocaleString()}
24h Change: ${coinData.price_change_percentage_24h?.toFixed(2)}%
7d Change: ${coinData.price_change_percentage_7d_in_currency?.toFixed(2)}%
24h High: $${coinData.high_24h?.toLocaleString()}
24h Low: $${coinData.low_24h?.toLocaleString()}
24h Volume: $${(coinData.total_volume / 1e9).toFixed(2)}B
Market Cap: $${(coinData.market_cap / 1e9).toFixed(2)}B${detailsStr}
` : 'No specific data available for this coin.'}

Provide a market prediction based on this REAL-TIME data:
1. Short-term outlook (24h-7d) - use current price as baseline
2. Medium-term outlook (1-4 weeks)
3. Key support/resistance levels - based on current price action
4. Sentiment analysis - based on recent performance
5. Confidence level (1-10)

IMPORTANT: Base ALL predictions on the actual current price and recent performance data above.

Respond in JSON format with keys: shortTerm (object with direction, target, confidence), mediumTerm (object), supportLevels (array), resistanceLevels (array), sentiment (bullish/bearish/neutral), overallConfidence (number), analysis (string).`;
        break;
      
      case "trading_signal":
        const signalCoinData = marketData[0];
        
        systemPrompt = `You are a trading signal generator with access to REAL-TIME market data.

CURRENT MARKET DATA FOR ${context?.symbol || "BTC"} (as of ${timestamp}):
${signalCoinData ? `
Current Price: $${signalCoinData.current_price.toLocaleString()}
24h Change: ${signalCoinData.price_change_percentage_24h?.toFixed(2)}%
7d Change: ${signalCoinData.price_change_percentage_7d_in_currency?.toFixed(2)}%
24h High: $${signalCoinData.high_24h?.toLocaleString()}
24h Low: $${signalCoinData.low_24h?.toLocaleString()}
24h Volume: $${(signalCoinData.total_volume / 1e9).toFixed(2)}B
Market Cap: $${(signalCoinData.market_cap / 1e9).toFixed(2)}B
` : `Current price: ${context?.price || "unknown"}`}

Generate trading signals based on this REAL-TIME data:
1. Signal type (BUY/SELL/HOLD) - based on current price action
2. Entry price range - relative to current price
3. Stop loss level - based on recent support/resistance
4. Take profit targets (3 levels) - calculated from current price
5. Risk/reward ratio
6. Signal strength (1-10)
7. Reasoning - citing specific data points

IMPORTANT: All price targets must be calculated relative to the CURRENT price of $${signalCoinData?.current_price?.toLocaleString() || context?.price || 'unknown'}.

Respond in JSON format with keys: signal (BUY/SELL/HOLD), entryRange (object with min, max), stopLoss (number), takeProfits (array of 3 numbers), riskReward (string), strength (number), reasoning (string), timeframe (string).`;
        break;
      
      default:
        systemPrompt = "You are a helpful cryptocurrency advisor with access to real-time market data.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: type === "chat",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Crypto AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
