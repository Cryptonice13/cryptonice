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
    if (!response.ok) return [];
    const data = await response.json();
    if (symbols && symbols.length > 0) {
      const symbolsLower = symbols.map(s => s.toLowerCase());
      return data.filter((coin: MarketData) => 
        symbolsLower.includes(coin.symbol.toLowerCase()) || symbolsLower.includes(coin.id.toLowerCase())
      );
    }
    return data;
  } catch { return []; }
}

async function fetchCoinDetails(coinId: string): Promise<any> {
  try {
    const url = `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

function formatMarketDataForPrompt(data: MarketData[]): string {
  if (!data || data.length === 0) return "No real-time market data available.";
  return data.map(coin => 
    `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()} | 24h: ${coin.price_change_percentage_24h?.toFixed(2)}% | 7d: ${coin.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(coin.total_volume / 1e9).toFixed(2)}B | MCap: $${(coin.market_cap / 1e9).toFixed(2)}B`
  ).join("\n");
}

const symbolMap: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
  'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2',
  'DOT': 'polkadot', 'MATIC': 'matic-network', 'LINK': 'chainlink', 'UNI': 'uniswap'
};

function buildSystemPrompt(type: string, marketData: MarketData[], coinDetails: any, context: any, timestamp: string): string {
  const realTimeDataStr = formatMarketDataForPrompt(marketData);
  const coinData = marketData[0];

  switch (type) {
    case "chat":
      return `You are CryptoAI, a sharp and concise crypto analyst. You have real-time market data.

LIVE DATA (${timestamp}):
${realTimeDataStr}

RESPONSE RULES:
- Be conversational and direct. Answer in 2-4 sentences for simple questions.
- Use bullet points for key data points, keep them short (one line each).
- Bold important numbers and percentages with **markdown**.
- NO lengthy disclaimers, NO "not financial advice" boilerplate, NO repeating data the user didn't ask for.
- Only expand into detailed analysis if the user specifically asks for a deep dive.
- Use emoji sparingly for visual clarity (📈📉🔥⚠️).
- Format with markdown (bold, bullets, headers) but keep it minimal.

${context ? `User's portfolio: ${JSON.stringify(context)}` : ""}`;

    case "portfolio_analysis":
      return `You are a portfolio analyst AI with REAL-TIME market data.

CURRENT MARKET DATA (as of ${timestamp}):
${realTimeDataStr}

Analyze the portfolio and provide: 1. Health score (1-100) 2. Diversification analysis 3. Risk level (low/medium/high) 4. Top 3 suggestions 5. Concerns

Portfolio: ${JSON.stringify(context)}

Respond in JSON: { healthScore, diversification, riskLevel, suggestions (array), concerns (array), summary (string) }`;

    case "market_prediction": {
      const detailsStr = coinDetails ? `\nMarket Cap Rank: #${coinDetails.market_cap_rank}\nATH: $${coinDetails.market_data?.ath?.usd?.toLocaleString()}\nCirculating Supply: ${coinDetails.market_data?.circulating_supply?.toLocaleString()}` : '';
      return `You are a crypto market analyst with REAL-TIME data.

${context?.symbol} DATA (${timestamp}):
${coinData ? `Price: $${coinData.current_price.toLocaleString()} | 24h: ${coinData.price_change_percentage_24h?.toFixed(2)}% | 7d: ${coinData.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(coinData.total_volume / 1e9).toFixed(2)}B${detailsStr}` : 'No data available.'}

Provide prediction with support/resistance levels based on CURRENT price.
Respond in JSON: { shortTerm: {direction, target, confidence}, mediumTerm: {direction, target, confidence}, supportLevels (array), resistanceLevels (array), sentiment, overallConfidence (number), analysis (string) }`;
    }

    case "trading_signal": {
      const signalCoinData = marketData[0];
      return `You are a trading signal generator with REAL-TIME data.

${context?.symbol} DATA (${timestamp}):
${signalCoinData ? `Price: $${signalCoinData.current_price.toLocaleString()} | 24h: ${signalCoinData.price_change_percentage_24h?.toFixed(2)}% | 7d: ${signalCoinData.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(signalCoinData.total_volume / 1e9).toFixed(2)}B` : `Price: ${context?.price || "unknown"}`}

Generate trading signal relative to current price $${signalCoinData?.current_price?.toLocaleString() || context?.price || 'unknown'}.
Respond in JSON: { signal (BUY/SELL/HOLD), entryRange: {min, max}, stopLoss, takeProfits (array of 3), riskReward, strength (1-10), reasoning, timeframe }`;
    }

    case "alert_suggestions":
      return `You are a crypto alert advisor with real-time data.

CURRENT DATA (${timestamp}):
${realTimeDataStr}

Watchlist assets: ${JSON.stringify(context)}

For each asset, suggest 1-2 optimal alert levels based on support/resistance analysis. Each suggestion needs type (above/below), price, reasoning, and confidence (1-10).

Respond in JSON array: [{ asset_symbol, asset_id, suggestions: [{ type: "above"|"below", price: number, reasoning: string, confidence: number }] }]`;

    case "whale_analysis":
      return `You are a whale activity analyst for ${context?.symbol || "BTC"}.

Current price: $${context?.price || 'unknown'} (${timestamp})

Based on typical volume patterns and market microstructure for ${context?.symbol}, generate realistic whale activity analysis including:
- 3-5 recent large transactions (buy/sell) with amount, value, timeAgo, exchange, significance
- Overall sentiment: accumulation, distribution, or neutral
- Brief summary

Respond in JSON: { transactions: [{ type: "buy"|"sell", amount: string, value: string, timeAgo: string, exchange: string, significance: "high"|"medium"|"low" }], sentiment: string, summary: string }`;

    case "strategy_builder": {
      const stratCoin = marketData[0];
      const stratDetails = coinDetails ? `\nMarket Cap Rank: #${coinDetails.market_cap_rank}\nATH: $${coinDetails.market_data?.ath?.usd?.toLocaleString()}\n52w High: $${coinDetails.market_data?.high_24h?.usd}\nCirculating Supply: ${coinDetails.market_data?.circulating_supply?.toLocaleString()}` : '';
      return `You are an advanced AI crypto trading strategy architect with REAL-TIME market data. You build precise, actionable strategies.

${context?.symbol} LIVE DATA (${timestamp}):
${stratCoin ? `Price: $${stratCoin.current_price.toLocaleString()} | 24h: ${stratCoin.price_change_percentage_24h?.toFixed(2)}% | 7d: ${stratCoin.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(stratCoin.total_volume / 1e9).toFixed(2)}B | MCap: $${(stratCoin.market_cap / 1e9).toFixed(2)}B${stratDetails}` : 'No data available.'}

USER REQUEST:
- Strategy Type: ${context?.strategyType || 'momentum'}
- Risk Tolerance: ${context?.riskLevel || 'moderate'}
- Investment Amount: $${context?.investmentAmount || 1000}
- Timeframe: ${context?.timeframe || '1W'}

INSTRUCTIONS:
Analyze the current market conditions for ${context?.symbol} and generate a complete trading strategy. All price levels MUST be relative to the CURRENT price of $${stratCoin?.current_price?.toLocaleString() || 'unknown'}.

For ${context?.strategyType || 'momentum'} strategy:
${context?.strategyType === 'mean_reversion' ? '- Focus on deviation from moving averages, Bollinger Bands, RSI overbought/oversold' : ''}
${context?.strategyType === 'breakout' ? '- Focus on key support/resistance levels, volume confirmation, breakout patterns' : ''}
${context?.strategyType === 'dca' ? '- Focus on dollar-cost averaging intervals, accumulation zones, long-term targets' : ''}
${context?.strategyType === 'scalping' ? '- Focus on short-term price action, tight stop-losses, quick profit targets' : ''}
${!context?.strategyType || context?.strategyType === 'momentum' ? '- Focus on trend strength, momentum indicators, MACD crossovers, volume trends' : ''}

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "strategyName": "descriptive strategy name",
  "signal": "BUY" | "SELL" | "HOLD",
  "entryPrice": number,
  "exitPrice": number,
  "stopLoss": number,
  "takeProfits": [number, number, number],
  "positionSize": number (percentage of investment),
  "riskRewardRatio": number,
  "winRateProbability": number (0-100),
  "confidence": number (0-100),
  "conditions": ["condition 1", "condition 2", "condition 3"],
  "reasoning": "2-3 sentence explanation of the strategy logic based on current market data",
  "supportLevels": [number, number],
  "resistanceLevels": [number, number],
  "indicators": {"rsi": number, "macdSignal": "bullish"|"bearish"|"neutral", "volumeTrend": "increasing"|"decreasing"|"stable"}
}`;
    }

    default:
      return "You are a helpful cryptocurrency advisor with real-time market data.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Processing ${type} request...`);

    let marketData: MarketData[] = [];
    let coinDetails: any = null;

    if (type === "chat" || type === "alert_suggestions") {
      marketData = (await fetchMarketData()).slice(0, 20);
    } else if (type === "portfolio_analysis" && context?.length > 0) {
      const symbols = context.map((item: any) => item.asset?.symbol || item.symbol).filter(Boolean);
      marketData = await fetchMarketData(symbols);
    } else if ((type === "market_prediction" || type === "trading_signal" || type === "whale_analysis" || type === "strategy_builder") && context?.symbol) {
      const coinId = symbolMap[context.symbol.toUpperCase()] || context.symbol.toLowerCase();
      marketData = await fetchMarketData([context.symbol]);
      if (type === "market_prediction" || type === "strategy_builder") coinDetails = await fetchCoinDetails(coinId);
    }

    const timestamp = new Date().toISOString();
    const systemPrompt = buildSystemPrompt(type, marketData, coinDetails, context, timestamp);

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
