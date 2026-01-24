import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    let systemPrompt = "";

    switch (type) {
      case "chat":
        systemPrompt = `You are CryptoAI, an expert cryptocurrency analyst and advisor. You provide:
- Portfolio analysis and optimization suggestions
- Market predictions based on technical and fundamental analysis
- Trading signals with entry/exit points
- Risk assessment and management advice

Always be concise, data-driven, and provide actionable insights. When discussing predictions, always include disclaimers about market volatility. Format responses with clear sections using markdown.

${context ? `User's portfolio context: ${JSON.stringify(context)}` : ""}`;
        break;
      
      case "portfolio_analysis":
        systemPrompt = `You are a portfolio analyst AI. Analyze the user's crypto portfolio and provide:
1. Portfolio health score (1-100)
2. Diversification analysis
3. Risk assessment (low/medium/high)
4. Top 3 optimization suggestions
5. Potential concerns

Portfolio data: ${JSON.stringify(context)}

Respond in JSON format with keys: healthScore, diversification, riskLevel, suggestions (array), concerns (array), summary (string).`;
        break;
      
      case "market_prediction":
        systemPrompt = `You are a crypto market analyst. Provide a market prediction for the given cryptocurrency.
Include:
1. Short-term outlook (24h-7d)
2. Medium-term outlook (1-4 weeks)
3. Key support/resistance levels
4. Sentiment analysis
5. Confidence level (1-10)

Cryptocurrency: ${context?.symbol || "BTC"}

Respond in JSON format with keys: shortTerm (object with direction, target, confidence), mediumTerm (object), supportLevels (array), resistanceLevels (array), sentiment (bullish/bearish/neutral), overallConfidence (number), analysis (string).`;
        break;
      
      case "trading_signal":
        systemPrompt = `You are a trading signal generator for cryptocurrencies. Analyze the given crypto and provide trading signals.

Include:
1. Signal type (BUY/SELL/HOLD)
2. Entry price range
3. Stop loss level
4. Take profit targets (3 levels)
5. Risk/reward ratio
6. Signal strength (1-10)
7. Reasoning

Cryptocurrency: ${context?.symbol || "BTC"}
Current price: ${context?.price || "unknown"}

Respond in JSON format with keys: signal (BUY/SELL/HOLD), entryRange (object with min, max), stopLoss (number), takeProfits (array of 3 numbers), riskReward (string), strength (number), reasoning (string), timeframe (string).`;
        break;
      
      default:
        systemPrompt = "You are a helpful cryptocurrency advisor.";
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
