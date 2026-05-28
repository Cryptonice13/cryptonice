import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-authoritative credit cost per request type
const CREDIT_COSTS: Record<string, number> = {
  chat: 1,
  agent_chat: 3,
  crypto_analyst: 1,
  alert_suggestions: 2,
  portfolio_analysis: 3,
  market_prediction: 2,
  trading_signal: 2,
  whale_analysis: 2,
  strategy_builder: 3,
  technical_analysis: 2,
  fundamental_analysis: 2,
  derivatives_strategy: 5,
};


const COINGECKO_API = "https://api.coingecko.com/api/v3";
const CRYPTOCOMPARE_API = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

async function fetch7DaySMA(): Promise<{ sma: number; prices: number[] } | null> {
  try {
    const url = `${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=7`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const prices = data.prices?.map((p: number[]) => p[1]) || [];
    if (prices.length === 0) return null;
    const sma = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
    return { sma: Math.round(sma * 100) / 100, prices };
  } catch { return null; }
}

async function fetchCryptoNews(): Promise<string[]> {
  try {
    const response = await fetch(CRYPTOCOMPARE_API);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.Data || []).slice(0, 3).map((item: any) => item.title || '');
  } catch { return []; }
}

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

    case "technical_analysis": {
      const taCoin = marketData[0];
      const taDetails = coinDetails ? `\nMarket Cap Rank: #${coinDetails.market_cap_rank}\nATH: $${coinDetails.market_data?.ath?.usd?.toLocaleString()}\nATL: $${coinDetails.market_data?.atl?.usd?.toLocaleString()}\nCirculating Supply: ${coinDetails.market_data?.circulating_supply?.toLocaleString()}\nMax Supply: ${coinDetails.market_data?.max_supply?.toLocaleString() || 'Unlimited'}` : '';
      return `You are an expert technical analyst specializing in cryptocurrency markets with access to REAL-TIME data.

${context?.symbol} LIVE DATA (${timestamp}):
${taCoin ? `Price: $${taCoin.current_price.toLocaleString()} | 24h: ${taCoin.price_change_percentage_24h?.toFixed(2)}% | 7d: ${taCoin.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(taCoin.total_volume / 1e9).toFixed(2)}B | MCap: $${(taCoin.market_cap / 1e9).toFixed(2)}B | 24h High: $${taCoin.high_24h?.toLocaleString()} | 24h Low: $${taCoin.low_24h?.toLocaleString()}${taDetails}` : 'No data available.'}

Perform a comprehensive technical analysis for ${context?.symbol}. Base ALL price levels on the CURRENT price of $${taCoin?.current_price?.toLocaleString() || 'unknown'}.

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "indicators": {
    "rsi": { "value": number (0-100), "signal": "oversold"|"neutral"|"overbought", "description": "string" },
    "macd": { "value": number, "signal": "bullish"|"bearish"|"neutral", "histogram": number, "description": "string" },
    "bollingerBands": { "upper": number, "middle": number, "lower": number, "position": "above_upper"|"upper_half"|"middle"|"lower_half"|"below_lower", "description": "string" },
    "movingAverages": { "sma20": number, "sma50": number, "sma200": number, "ema12": number, "ema26": number, "crossover": "golden_cross"|"death_cross"|"none", "trend": "bullish"|"bearish"|"neutral", "description": "string" }
  },
  "supportResistance": {
    "supports": [{ "price": number, "strength": "strong"|"moderate"|"weak" }, { "price": number, "strength": "strong"|"moderate"|"weak" }, { "price": number, "strength": "strong"|"moderate"|"weak" }],
    "resistances": [{ "price": number, "strength": "strong"|"moderate"|"weak" }, { "price": number, "strength": "strong"|"moderate"|"weak" }, { "price": number, "strength": "strong"|"moderate"|"weak" }]
  },
  "volumeAnalysis": { "trend": "increasing"|"decreasing"|"stable", "averageVolume": number, "currentVolume": number, "volumeRatio": number, "description": "string" },
  "trendAnalysis": { "direction": "bullish"|"bearish"|"sideways", "strength": number (1-10), "timeframe": "string", "description": "string" },
  "chartPatterns": [{ "pattern": "string", "type": "bullish"|"bearish"|"neutral", "significance": "high"|"medium"|"low" }],
  "verdict": { "signal": "BUY"|"SELL"|"HOLD", "confidence": number (0-100), "reasoning": "string", "keyLevels": { "entry": number, "stopLoss": number, "target": number } }
}`;
    }

    case "fundamental_analysis": {
      const faCoin = marketData[0];
      const faDetails = coinDetails ? `\nMarket Cap Rank: #${coinDetails.market_cap_rank}\nATH: $${coinDetails.market_data?.ath?.usd?.toLocaleString()}\nATH Change: ${coinDetails.market_data?.ath_change_percentage?.usd?.toFixed(2)}%\nCirculating Supply: ${coinDetails.market_data?.circulating_supply?.toLocaleString()}\nMax Supply: ${coinDetails.market_data?.max_supply?.toLocaleString() || 'Unlimited'}\nTotal Supply: ${coinDetails.market_data?.total_supply?.toLocaleString()}\nDescription: ${coinDetails.description?.en?.slice(0, 300) || 'N/A'}` : '';
      return `You are a senior crypto fundamental analyst with deep knowledge of blockchain ecosystems, tokenomics, and market dynamics.

${context?.symbol} LIVE DATA (${timestamp}):
${faCoin ? `Price: $${faCoin.current_price.toLocaleString()} | 24h: ${faCoin.price_change_percentage_24h?.toFixed(2)}% | 7d: ${faCoin.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(faCoin.total_volume / 1e9).toFixed(2)}B | MCap: $${(faCoin.market_cap / 1e9).toFixed(2)}B${faDetails}` : 'No data available.'}

Perform a comprehensive fundamental analysis for ${context?.symbol}. Evaluate the project's long-term value proposition.

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "overallScore": number (0-100),
  "tokenomics": {
    "circulatingSupply": "string",
    "maxSupply": "string",
    "inflationRate": "string",
    "distribution": "string",
    "score": number (0-100),
    "description": "string"
  },
  "marketPosition": {
    "rank": number,
    "dominance": "string",
    "competitors": ["string"],
    "moat": "string",
    "score": number (0-100),
    "description": "string"
  },
  "ecosystem": {
    "partnerships": ["string"],
    "dapps": number,
    "developers": "string",
    "activity": "high"|"medium"|"low",
    "score": number (0-100),
    "description": "string"
  },
  "catalysts": [
    { "event": "string", "impact": "high"|"medium"|"low", "timeframe": "string" }
  ],
  "risks": [
    { "factor": "string", "severity": "high"|"medium"|"low", "likelihood": "high"|"medium"|"low" }
  ],
  "assessment": {
    "thesis": "string",
    "outlook": "bullish"|"bearish"|"neutral",
    "summary": "string"
  }
}`;
    }

    case "crypto_analyst": {
      const btcData = marketData.find(c => c.symbol === 'btc') || marketData[0];
      const smaData = context?.smaData;
      const newsHeadlines = context?.newsHeadlines || [];
      return `You are the Strict Crypto Analyst — an emotionless, data-driven financial analyst whose #1 priority is CAPITAL PRESERVATION.

CURRENT BTC DATA (${timestamp}):
${btcData ? `Price: $${btcData.current_price.toLocaleString()} | 24h: ${btcData.price_change_percentage_24h?.toFixed(2)}% | 7d: ${btcData.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(btcData.total_volume / 1e9).toFixed(2)}B | MCap: $${(btcData.market_cap / 1e9).toFixed(2)}B` : 'No data available.'}

7-DAY SIMPLE MOVING AVERAGE: ${smaData?.sma ? `$${smaData.sma.toLocaleString()}` : 'Unavailable'}

TOP CRYPTO NEWS:
${newsHeadlines.length > 0 ? newsHeadlines.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n') : 'No headlines available.'}

STRICT RULES:
- You are emotionless. No excitement, no hype, no FOMO.
- If current price is significantly above the 7-day SMA (>5%), recommend WAIT.
- If data is conflicting or uncertain, DEFAULT to WAIT to preserve capital.
- You must use ALL three data sources (price, SMA, news) in your reasoning.

RESPONSE FORMAT (use markdown headers exactly):
## Analysis
[Technical analysis using price data and SMA comparison]

## The 'Why'
[Explain the reasoning behind your assessment using all data points]

## Risk Assessment
[Evaluate risk factors from news, volatility, and SMA deviation]

## Final Decision
**[BUY / SELL / HOLD / WAIT]**
[One-sentence justification]`;
    }

    case "derivatives_strategy": {
      const dCoin = marketData[0];
      const dDetails = coinDetails ? `\nMarket Cap Rank: #${coinDetails.market_cap_rank}\nATH: $${coinDetails.market_data?.ath?.usd?.toLocaleString()}` : '';
      const isOptions = context?.mode === 'options';
      return `You are an advanced AI crypto derivatives strategist with REAL-TIME market data.

${context?.symbol} LIVE DATA (${timestamp}):
${dCoin ? `Price: $${dCoin.current_price.toLocaleString()} | 24h: ${dCoin.price_change_percentage_24h?.toFixed(2)}% | 7d: ${dCoin.price_change_percentage_7d_in_currency?.toFixed(2)}% | Vol: $${(dCoin.total_volume / 1e9).toFixed(2)}B | MCap: $${(dCoin.market_cap / 1e9).toFixed(2)}B${dDetails}` : 'No data available.'}

USER REQUEST:
- Mode: ${context?.mode}
- Risk Level: ${context?.riskLevel || 'moderate'}
- Investment: $${context?.investmentAmount || 1000}
${isOptions ? `- Contract: ${context?.contractType || 'call'}
- Strike Price: ${context?.strikePrice ? '$' + context.strikePrice : 'AI suggest'}
- Expiry: ${context?.expiry || '1M'}
- Preset: ${context?.optionPreset || 'long_call'}
- Premium Budget: ${context?.premiumBudget ? '$' + context.premiumBudget : 'auto'}` : `- Direction: ${context?.positionDirection || 'long'}
- Leverage: ${context?.leverage || 10}x
- Contract: ${context?.futuresContract || 'perpetual'}
- Margin: ${context?.marginType || 'isolated'}`}

INSTRUCTIONS:
${isOptions ? `Generate a complete options strategy. Calculate simulated Greeks based on implied volatility estimates. For the preset "${context?.optionPreset || 'long_call'}":
- Calculate breakeven price, max profit, max loss
- Estimate Delta, Gamma, Theta, Vega
- Provide optimal entry/exit timing
- All prices relative to current price $${dCoin?.current_price?.toLocaleString() || 'unknown'}` : `Generate a complete futures strategy with ${context?.leverage || 10}x leverage.
- Calculate liquidation price: entry * (1 ${context?.positionDirection === 'short' ? '+' : '-'} 1/${context?.leverage || 10}) for ${context?.positionDirection || 'long'}
- Calculate margin requirements based on position size
- Assess funding rate impact for ${context?.futuresContract || 'perpetual'} contracts
- All prices relative to current price $${dCoin?.current_price?.toLocaleString() || 'unknown'}`}

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "strategyName": "descriptive name",
  "signal": "BUY" | "SELL" | "HOLD",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfits": [number, number, number],
  "positionSize": number,
  "riskRewardRatio": number,
  "winRateProbability": number (0-100),
  "confidence": number (0-100),
  "conditions": ["condition1", "condition2"],
  "reasoning": "explanation",
  "maxProfit": "string description e.g. '$5,000' or 'Unlimited'",
  "maxLoss": "string description e.g. '$1,000 (premium paid)'",
  "breakevenPrice": number
  ${isOptions ? `,"greeks": {"delta": number, "gamma": number, "theta": number, "vega": number}` : `,"liquidationPrice": number, "leverage": number, "marginRequired": "string e.g. '$100'", "fundingRateImpact": "string e.g. '-$2.50/day'"`}
}`;
    }

    default:
      return "You are a helpful cryptocurrency advisor with real-time market data.";
}

// ============= AGENT TOOLS =============
// Each tool returns compact structured JSON. The agent model reasons over these.

function resolveCoinId(symbol: string): string {
  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
}

function snapshotFromMarket(c: MarketData) {
  return {
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price,
    change24h: c.price_change_percentage_24h,
    change7d: c.price_change_percentage_7d_in_currency,
    volume24h: c.total_volume,
    marketCap: c.market_cap,
    high24h: c.high_24h,
    low24h: c.low_24h,
    ath: c.ath,
    athChange: c.ath_change_percentage,
  };
}

async function toolGetMarketSnapshot(args: { symbols?: string[]; top?: number }) {
  const all = await fetchMarketData(args.symbols && args.symbols.length ? args.symbols : undefined);
  const limited = args.symbols?.length ? all : all.slice(0, args.top || 10);
  return { assets: limited.map(snapshotFromMarket) };
}

async function toolPredictPrice(args: { symbol: string }) {
  const data = await fetchMarketData([args.symbol]);
  const c = data[0];
  if (!c) return { error: `No data for ${args.symbol}` };
  const price = c.current_price;
  const range = (c.high_24h - c.low_24h) || price * 0.02;
  const trend = (c.price_change_percentage_7d_in_currency ?? 0) > 0 ? 'bullish' : 'bearish';
  return {
    symbol: c.symbol.toUpperCase(),
    price,
    shortTerm: { direction: trend, target: +(price * (trend === 'bullish' ? 1.03 : 0.97)).toFixed(4), confidence: 6 },
    mediumTerm: { direction: trend, target: +(price * (trend === 'bullish' ? 1.08 : 0.92)).toFixed(4), confidence: 5 },
    supportLevels: [+(c.low_24h).toFixed(4), +(price - range).toFixed(4)],
    resistanceLevels: [+(c.high_24h).toFixed(4), +(price + range).toFixed(4)],
    sentiment: trend,
    change24h: c.price_change_percentage_24h,
    change7d: c.price_change_percentage_7d_in_currency,
  };
}

async function toolTradingSignal(args: { symbol: string }) {
  const data = await fetchMarketData([args.symbol]);
  const c = data[0];
  if (!c) return { error: `No data for ${args.symbol}` };
  const price = c.current_price;
  const ch24 = c.price_change_percentage_24h ?? 0;
  const ch7 = c.price_change_percentage_7d_in_currency ?? 0;
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (ch7 > 5 && ch24 > 0) signal = 'BUY';
  else if (ch7 < -5 && ch24 < 0) signal = 'SELL';
  const sl = signal === 'BUY' ? price * 0.95 : signal === 'SELL' ? price * 1.05 : price * 0.97;
  return {
    symbol: c.symbol.toUpperCase(),
    price,
    signal,
    entryRange: { min: +(price * 0.99).toFixed(4), max: +(price * 1.01).toFixed(4) },
    stopLoss: +sl.toFixed(4),
    takeProfits: signal === 'SELL'
      ? [+(price * 0.97).toFixed(4), +(price * 0.94).toFixed(4), +(price * 0.90).toFixed(4)]
      : [+(price * 1.03).toFixed(4), +(price * 1.06).toFixed(4), +(price * 1.10).toFixed(4)],
    riskReward: '1:2',
    strength: Math.min(10, Math.max(1, Math.round(Math.abs(ch7) / 2))),
    timeframe: '1D-1W',
    change24h: ch24,
    change7d: ch7,
  };
}

async function toolTechnicalAnalysis(args: { symbol: string }) {
  const [data, smaInfo] = await Promise.all([fetchMarketData([args.symbol]), args.symbol.toUpperCase() === 'BTC' ? fetch7DaySMA() : Promise.resolve(null)]);
  const c = data[0];
  if (!c) return { error: `No data for ${args.symbol}` };
  const price = c.current_price;
  const ch24 = c.price_change_percentage_24h ?? 0;
  const ch7 = c.price_change_percentage_7d_in_currency ?? 0;
  const rsi = Math.max(10, Math.min(90, 50 + ch7 * 2));
  return {
    symbol: c.symbol.toUpperCase(),
    price,
    indicators: {
      rsi: +rsi.toFixed(1),
      rsiSignal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral',
      macdSignal: ch24 > 0 && ch7 > 0 ? 'bullish' : ch24 < 0 && ch7 < 0 ? 'bearish' : 'neutral',
      sma7: smaInfo?.sma ?? null,
      priceVsSma7Pct: smaInfo?.sma ? +(((price - smaInfo.sma) / smaInfo.sma) * 100).toFixed(2) : null,
    },
    supports: [+(c.low_24h).toFixed(4)],
    resistances: [+(c.high_24h).toFixed(4)],
    trend: ch7 > 0 ? 'bullish' : ch7 < 0 ? 'bearish' : 'sideways',
  };
}

async function toolFundamentalAnalysis(args: { symbol: string }) {
  const coinId = resolveCoinId(args.symbol);
  const [data, details] = await Promise.all([fetchMarketData([args.symbol]), fetchCoinDetails(coinId)]);
  const c = data[0];
  if (!c) return { error: `No data for ${args.symbol}` };
  return {
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    marketCapRank: details?.market_cap_rank ?? null,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    ath: c.ath,
    athChangePct: c.ath_change_percentage,
    circulatingSupply: details?.market_data?.circulating_supply ?? null,
    maxSupply: details?.market_data?.max_supply ?? null,
    description: (details?.description?.en || '').slice(0, 400),
    categories: details?.categories?.slice(0, 5) ?? [],
    homepage: details?.links?.homepage?.[0] ?? null,
  };
}

function toolAnalyzePortfolio(_args: Record<string, never>, ctx: any) {
  const portfolio: any[] = Array.isArray(ctx?.portfolio) ? ctx.portfolio : [];
  if (portfolio.length === 0) return { error: 'No portfolio holdings found.' };
  const totalValue = portfolio.reduce((s, p) => s + (Number(p.value) || Number(p.amount) * Number(p.price) || 0), 0);
  const breakdown = portfolio.map((p) => {
    const value = Number(p.value) || Number(p.amount) * Number(p.price) || 0;
    return {
      symbol: p.symbol || p.asset?.symbol || 'UNK',
      amount: p.amount,
      value: +value.toFixed(2),
      allocationPct: totalValue ? +((value / totalValue) * 100).toFixed(2) : 0,
    };
  });
  const top = [...breakdown].sort((a, b) => b.allocationPct - a.allocationPct)[0];
  const concentration = top?.allocationPct ?? 0;
  return {
    totalValueUsd: +totalValue.toFixed(2),
    holdings: breakdown.length,
    breakdown,
    topPosition: top,
    concentrationPct: concentration,
    riskLevel: concentration > 60 ? 'high' : concentration > 35 ? 'medium' : 'low',
  };
}

async function toolSuggestTrade(args: { direction?: 'long' | 'short'; top?: number }) {
  const all = await fetchMarketData();
  const top = (args.top && args.top > 0 ? args.top : 5);
  const sorted = [...all].sort((a, b) => {
    const av = a.price_change_percentage_7d_in_currency ?? 0;
    const bv = b.price_change_percentage_7d_in_currency ?? 0;
    return args.direction === 'short' ? av - bv : bv - av;
  });
  return {
    direction: args.direction || 'long',
    picks: sorted.slice(0, top).map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change24h: c.price_change_percentage_24h,
      change7d: c.price_change_percentage_7d_in_currency,
      volume24h: c.total_volume,
    })),
  };
}

async function toolGetNews(_args: { symbol?: string }) {
  const headlines = await fetchCryptoNews();
  return { headlines };
}

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_market_snapshot',
      description: 'Get live price, 24h/7d change, volume, market cap for one or more cryptocurrencies, or the top N by market cap.',
      parameters: {
        type: 'object',
        properties: {
          symbols: { type: 'array', items: { type: 'string' }, description: 'Ticker symbols like BTC, ETH, SOL.' },
          top: { type: 'number', description: 'Return top N by market cap when symbols not provided.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'predict_price',
      description: 'Predict short and medium-term direction with support/resistance levels for a single asset.',
      parameters: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_trading_signal',
      description: 'Generate a BUY/SELL/HOLD trading signal with entry range, stop-loss, and take-profit levels.',
      parameters: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'technical_analysis',
      description: 'Run technical analysis: RSI, MACD-like signal, moving average context, support/resistance, trend.',
      parameters: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fundamental_analysis',
      description: 'Fetch tokenomics, supply, market cap rank, categories, and project description for an asset.',
      parameters: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_portfolio',
      description: "Analyze the user's current portfolio holdings: allocations, concentration, risk level.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_trade',
      description: 'Suggest top trade ideas ranked by 7-day momentum (long = top gainers, short = top losers).',
      parameters: {
        type: 'object',
        properties: {
          direction: { type: 'string', enum: ['long', 'short'] },
          top: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: 'Fetch the latest crypto news headlines.',
      parameters: { type: 'object', properties: { symbol: { type: 'string' } } },
    },
  },
];

async function executeAgentTool(name: string, args: any, ctx: any): Promise<any> {
  try {
    switch (name) {
      case 'get_market_snapshot': return await toolGetMarketSnapshot(args || {});
      case 'predict_price': return await toolPredictPrice(args);
      case 'generate_trading_signal': return await toolTradingSignal(args);
      case 'technical_analysis': return await toolTechnicalAnalysis(args);
      case 'fundamental_analysis': return await toolFundamentalAnalysis(args);
      case 'analyze_portfolio': return toolAnalyzePortfolio(args, ctx);
      case 'suggest_trade': return await toolSuggestTrade(args || {});
      case 'get_news': return await toolGetNews(args || {});
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'tool_failed' };
  }
}

function buildAgentSystemPrompt(ctx: any, timestamp: string): string {
  const portfolioSummary = Array.isArray(ctx?.portfolio) && ctx.portfolio.length
    ? `User has ${ctx.portfolio.length} holdings.`
    : 'User has no portfolio data loaded.';
  const activeAsset = ctx?.activeAsset
    ? `Active asset in UI context: ${ctx.activeAsset.symbol} @ $${ctx.activeAsset.price}.`
    : '';
  return `You are CryptoNice Agent — an autonomous AI trading assistant.
You decide which tools to call based on the user's question. Use tools whenever fresh market data, predictions, signals, or portfolio analysis is needed.

CURRENT TIME: ${timestamp}
${portfolioSummary}
${activeAsset}

TOOL USAGE RULES:
- For price/market questions → call get_market_snapshot.
- For "where is X going / prediction" → call predict_price.
- For "should I buy/sell / give me a signal" → call generate_trading_signal.
- For "TA / RSI / MACD / chart" → call technical_analysis.
- For "is X a good project / tokenomics / fundamentals" → call fundamental_analysis.
- For "review my portfolio / am I diversified" → call analyze_portfolio.
- For "what should I trade / top picks / best coins now" → call suggest_trade.
- For "news / what's happening" → call get_news.
- You may call multiple tools in parallel when helpful.

RESPONSE STYLE:
- After tools return, write a concise (3-6 sentence) actionable answer in markdown.
- Bold key numbers with **markdown**. Use bullets sparingly.
- Always state the signal, the levels, and the rationale. No boilerplate disclaimers.
- Do NOT repeat the entire JSON; the UI renders rich cards from tool results.`;
}



serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Input validation / sanitization (mitigate prompt injection) ----
    const ALLOWED_TYPES = new Set([
      "chat", "agent_chat", "crypto_analyst", "alert_suggestions", "portfolio_analysis",
      "market_prediction", "trading_signal", "whale_analysis", "strategy_builder",
      "technical_analysis", "fundamental_analysis", "derivatives_strategy",
    ]);
    const type = typeof body.type === "string" && ALLOWED_TYPES.has(body.type) ? body.type : null;
    if (!type) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizeStr = (v: unknown, max = 64, pattern = /[^A-Za-z0-9_\-./ ]/g) =>
      typeof v === "string" ? v.replace(pattern, "").slice(0, max) : undefined;
    const sanitizeNum = (v: unknown, min = 0, max = 1e12) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : undefined;
    };

    let context: any = body.context;
    if (Array.isArray(context)) {
      // portfolio_analysis: array of holdings — keep as-is but cap length
      context = context.slice(0, 50);
    } else if (context && typeof context === "object") {
      context = {
        ...context,
        symbol: sanitizeStr(context.symbol, 16, /[^A-Za-z0-9]/g),
        strategyType: sanitizeStr(context.strategyType, 32),
        riskLevel: sanitizeStr(context.riskLevel, 16, /[^A-Za-z]/g),
        mode: sanitizeStr(context.mode, 32),
        positionDirection: sanitizeStr(context.positionDirection, 8, /[^A-Za-z]/g),
        futuresContract: sanitizeStr(context.futuresContract, 16),
        marginType: sanitizeStr(context.marginType, 16, /[^A-Za-z]/g),
        contractType: sanitizeStr(context.contractType, 8, /[^A-Za-z]/g),
        optionPreset: sanitizeStr(context.optionPreset, 32),
        expiry: sanitizeStr(context.expiry, 8),
        timeframe: sanitizeStr(context.timeframe, 8),
        investmentAmount: sanitizeNum(context.investmentAmount, 0, 1e9),
        leverage: sanitizeNum(context.leverage, 1, 125),
        strikePrice: sanitizeNum(context.strikePrice, 0, 1e9),
        premiumBudget: sanitizeNum(context.premiumBudget, 0, 1e9),
      };
    } else {
      context = {};
    }

    let messages = Array.isArray(body.messages) ? body.messages : [];
    messages = messages.slice(-20).map((m: any) => ({
      role: m?.role === "assistant" || m?.role === "system" ? m.role : "user",
      content: typeof m?.content === "string" ? m.content.slice(0, 4000) : "",
    })).filter((m: any) => m.content);

    console.log(`Processing ${type} request...`);

    // ---- Server-authoritative credit deduction ----
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const userClient = createClient(SUPABASE_URL, ANON_KEY);
        const { data } = await userClient.auth.getUser(token);
        if (data?.user) userId = data.user.id;
      } catch (_) { /* ignore */ }
    }

    const walletAddress = typeof body.walletAddress === "string"
      ? body.walletAddress.replace(/[^A-Za-z0-9]/g, "").slice(0, 64)
      : null;

    if (!userId && !walletAddress) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cost = CREDIT_COSTS[type] ?? 1;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: deductData, error: deductErr } = await admin.rpc("deduct_credits_atomic", {
      _user_id: userId,
      _wallet: userId ? null : walletAddress,
      _amount: cost,
      _description: `AI ${type} (${cost} credits)`,
    });

    if (deductErr) {
      console.error("Credit deduction error:", deductErr);
      return new Response(JSON.stringify({ error: "Credit check failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof deductData === "number" && deductData < 0) {
      return new Response(JSON.stringify({ error: "Insufficient credits", required: cost }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= AGENT CHAT (tool-calling loop) =============
    if (type === "agent_chat") {
      const agentTimestamp = new Date().toISOString();
      const sysPrompt = buildAgentSystemPrompt(context, agentTimestamp);
      const convo: any[] = [
        { role: "system", content: sysPrompt },
        ...messages,
      ];
      const toolCallsLog: Array<{ name: string; args: any; result: any }> = [];
      let finalContent = "";

      for (let step = 0; step < 6; step++) {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: convo,
            tools: AGENT_TOOLS,
            tool_choice: "auto",
            stream: false,
          }),
        });

        if (!r.ok) {
          if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          const t = await r.text();
          console.error("agent gateway error:", r.status, t);
          return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const data = await r.json();
        const msg = data.choices?.[0]?.message;
        if (!msg) break;

        const toolCalls = msg.tool_calls || [];
        // Push assistant message (must include tool_calls if present, per OpenAI spec)
        convo.push({
          role: "assistant",
          content: msg.content || "",
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        });

        if (!toolCalls.length) {
          finalContent = msg.content || "";
          break;
        }

        // Execute all tool calls in parallel
        const results = await Promise.all(toolCalls.map(async (tc: any) => {
          let parsedArgs: any = {};
          try { parsedArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}; } catch { /* noop */ }
          const result = await executeAgentTool(tc.function?.name, parsedArgs, context);
          return { tc, parsedArgs, result };
        }));

        for (const { tc, parsedArgs, result } of results) {
          toolCallsLog.push({ name: tc.function?.name, args: parsedArgs, result });
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result).slice(0, 8000),
          });
        }
      }

      if (!finalContent) {
        finalContent = toolCallsLog.length
          ? "Here is the latest data — see the cards below for details."
          : "I couldn't generate a response. Please try again.";
      }

      return new Response(JSON.stringify({
        content: finalContent,
        toolCalls: toolCallsLog,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    let coinDetails: any = null;

    if (type === "chat" || type === "alert_suggestions") {
      marketData = (await fetchMarketData()).slice(0, 20);
    } else if (type === "crypto_analyst") {
      const [btcMarket, smaData, newsHeadlines] = await Promise.all([
        fetchMarketData(["bitcoin"]),
        fetch7DaySMA(),
        fetchCryptoNews(),
      ]);
      marketData = btcMarket;
      // Inject into context for the prompt builder
      context.smaData = smaData;
      context.newsHeadlines = newsHeadlines;
    } else if (type === "portfolio_analysis" && context?.length > 0) {
      const symbols = context.map((item: any) => item.asset?.symbol || item.symbol).filter(Boolean);
      marketData = await fetchMarketData(symbols);
    } else if ((type === "market_prediction" || type === "trading_signal" || type === "whale_analysis" || type === "strategy_builder" || type === "technical_analysis" || type === "fundamental_analysis" || type === "derivatives_strategy") && context?.symbol) {
      const coinId = symbolMap[context.symbol.toUpperCase()] || context.symbol.toLowerCase();
      marketData = await fetchMarketData([context.symbol]);
      if (type === "market_prediction" || type === "strategy_builder" || type === "technical_analysis" || type === "fundamental_analysis" || type === "derivatives_strategy") coinDetails = await fetchCoinDetails(coinId);
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
        stream: type === "chat" || type === "crypto_analyst",
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

    if (type === "chat" || type === "crypto_analyst") {
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
