import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json() as { prompt: string };
    if (!prompt || prompt.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Prompt too short" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You parse natural-language crypto alerts into structured rules.

Supported metrics: price, price_change_24h_pct, price_change_7d_pct, volume_24h, volume_ratio_24h (current vs 7d avg), market_cap

Operators: gt (>), lt (<), gte (>=), lte (<=)

Asset IDs use CoinGecko slugs: bitcoin, ethereum, solana, binancecoin, ripple, cardano, dogecoin, avalanche-2, polkadot, matic-network, chainlink, uniswap, etc.

Always return at least one condition. If user mentions multiple assets/conditions, link them with AND or OR. Generate a short descriptive name (max 50 chars).`
          },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_alert",
            description: "Parse the natural language alert into structured conditions",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Short descriptive name for the alert (max 50 chars)" },
                logic: { type: "string", enum: ["AND", "OR"], description: "How to combine multiple conditions" },
                conditions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      asset_id: { type: "string", description: "CoinGecko asset ID slug" },
                      asset_symbol: { type: "string", description: "Ticker like BTC, ETH" },
                      metric: { type: "string", enum: ["price", "price_change_24h_pct", "price_change_7d_pct", "volume_24h", "volume_ratio_24h", "market_cap"] },
                      operator: { type: "string", enum: ["gt", "lt", "gte", "lte"] },
                      value: { type: "number" }
                    },
                    required: ["asset_id", "asset_symbol", "metric", "operator", "value"]
                  }
                }
              },
              required: ["name", "logic", "conditions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "parse_alert" } }
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-conditional-alert error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
