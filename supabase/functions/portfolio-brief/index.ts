import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COINGECKO = "https://api.coingecko.com/api/v3";
const NEWS_API = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

interface PortfolioItem {
  symbol: string;
  asset_id: string;
  name?: string;
  amount: number;
  avg_buy_price: number;
}

async function fetchMarkets(ids: string[]) {
  if (ids.length === 0) return [];
  try {
    const url = `${COINGECKO}/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=24h,7d`;
    const r = await fetch(url);
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

async function fetchNews(symbols: string[]): Promise<any[]> {
  try {
    const r = await fetch(`${NEWS_API}&categories=${symbols.slice(0, 5).join(",")}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.Data || []).slice(0, 5).map((n: any) => ({
      title: n.title, url: n.url, source: n.source, published_on: n.published_on,
    }));
  } catch { return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { portfolio, userId, walletAddress } = await req.json() as {
      portfolio: PortfolioItem[]; userId?: string; walletAddress?: string;
    };

    if (!portfolio || portfolio.length === 0) {
      return new Response(JSON.stringify({ error: "Portfolio is empty" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if today's brief already exists
    const today = new Date().toISOString().slice(0, 10);
    let existingQuery = supabase.from("portfolio_briefs").select("*").eq("brief_date", today).limit(1);
    if (userId) existingQuery = existingQuery.eq("user_id", userId);
    else if (walletAddress) existingQuery = existingQuery.eq("wallet_address", walletAddress).is("user_id", null);
    const { data: existing } = await existingQuery;
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ brief: existing[0], cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch live market data
    const ids = portfolio.map(p => p.asset_id).filter(Boolean);
    const [markets, news] = await Promise.all([fetchMarkets(ids), fetchNews(portfolio.map(p => p.symbol))]);

    // Compute portfolio totals
    let totalValue = 0;
    let totalCost = 0;
    let dayChangeUsd = 0;
    const enriched = portfolio.map(p => {
      const m = markets.find((x: any) => x.id === p.asset_id);
      const price = m?.current_price || p.avg_buy_price;
      const value = p.amount * price;
      const cost = p.amount * p.avg_buy_price;
      const change24h = m?.price_change_percentage_24h || 0;
      const dayChange = value * (change24h / 100);
      totalValue += value;
      totalCost += cost;
      dayChangeUsd += dayChange;
      return { ...p, current_price: price, value, change_24h_pct: change24h, change_24h_usd: dayChange };
    });
    const dayChangePct = totalValue > 0 ? (dayChangeUsd / (totalValue - dayChangeUsd)) * 100 : 0;

    // Build AI prompt
    const moversCtx = enriched.map(e =>
      `${e.symbol}: $${e.current_price.toFixed(2)} (${e.change_24h_pct >= 0 ? "+" : ""}${e.change_24h_pct.toFixed(2)}% 24h, contributed ${e.change_24h_usd >= 0 ? "+" : ""}$${e.change_24h_usd.toFixed(2)})`
    ).join("\n");
    const newsCtx = news.map(n => `- ${n.title} (${n.source})`).join("\n");

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
          { role: "system", content: "You are a personal portfolio analyst. Generate a concise, personalized daily brief explaining WHY the user's portfolio moved today. Be specific, cite real catalysts from the news, and avoid generic statements." },
          { role: "user", content: `Portfolio holdings & 24h moves:\n${moversCtx}\n\nTotal value: $${totalValue.toFixed(2)} | Day change: ${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}%\n\nRecent crypto news:\n${newsCtx}\n\nGenerate today's brief.` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_brief",
            description: "Return the daily portfolio brief",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "1-2 sentence punchy headline summary of today's portfolio activity" },
                top_movers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      change_pct: { type: "number" },
                      contribution_usd: { type: "number" },
                      direction: { type: "string", enum: ["up", "down"] }
                    },
                    required: ["symbol", "change_pct", "contribution_usd", "direction"]
                  }
                },
                why_explanations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      reason: { type: "string", description: "Specific reason for this asset's movement, citing news/catalyst when possible" }
                    },
                    required: ["symbol", "reason"]
                  }
                },
                news_drivers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      affected_symbols: { type: "array", items: { type: "string" } }
                    },
                    required: ["title", "impact", "affected_symbols"]
                  }
                },
                outlook: {
                  type: "object",
                  properties: {
                    sentiment: { type: "string", enum: ["bullish", "bearish", "neutral", "cautious"] },
                    next_24h: { type: "string", description: "What to watch in the next 24 hours" }
                  },
                  required: ["sentiment", "next_24h"]
                }
              },
              required: ["summary", "top_movers", "why_explanations", "news_drivers", "outlook"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_brief" } }
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const briefData = JSON.parse(toolCall.function.arguments);

    // Persist
    const insertRow: any = {
      brief_date: today,
      portfolio_snapshot: enriched,
      total_value: totalValue,
      day_change_pct: dayChangePct,
      brief_data: briefData,
    };
    if (userId) insertRow.user_id = userId;
    else if (walletAddress) insertRow.wallet_address = walletAddress;

    const { data: saved, error: insertErr } = await supabase
      .from("portfolio_briefs")
      .insert(insertRow)
      .select()
      .single();

    if (insertErr) console.error("Insert error:", insertErr);

    return new Response(JSON.stringify({ brief: saved || insertRow, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("portfolio-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
