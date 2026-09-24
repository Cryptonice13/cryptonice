// Edge function: prediction-markets
// Handles authenticated create/trade actions and automated settlement for
// Community prediction markets. All credit and position changes happen inside
// protected database functions called with the service role.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  LTC: "litecoin",
  ATOM: "cosmos",
  ARB: "arbitrum",
  OP: "optimism",
};

const CreateMarketSchema = z.object({
  action: z.literal("create_market"),
  question: z.string().trim().min(15).max(240),
  assetSymbol: z.string().trim().toUpperCase().refine(value => Boolean(SYMBOL_TO_ID[value])),
  targetPrice: z.number().finite().positive().max(100_000_000),
  direction: z.enum(["above", "below"]),
  closeAt: z.string().datetime(),
  resolveAt: z.string().datetime(),
});

const PlaceOrderSchema = z.object({
  action: z.literal("place_order"),
  marketId: z.string().uuid(),
  side: z.enum(["yes", "no"]),
  price: z.number().int().min(1).max(99),
  quantity: z.number().int().min(1).max(100_000),
});

const SettleDueSchema = z.object({ action: z.literal("settle_due") });

export const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_TO_ID);

const ERROR_MESSAGES: Record<string, string> = {
  authentication_required: "Please sign in to continue.",
  invalid_question: "Write a clear question between 15 and 240 characters.",
  invalid_asset: "Choose a supported crypto asset.",
  invalid_target_price: "Enter a target price greater than zero.",
  invalid_direction: "Choose whether the price must be above or below the target.",
  invalid_market_times: "Trading must close in the future, and settlement must come after it closes.",
  invalid_resolution_source: "Choose a supported price source.",
  invalid_side: "Choose Yes or No.",
  invalid_order: "Enter a price between 1 and 99 and a whole number of shares.",
  market_not_found: "This market no longer exists.",
  market_closed: "Trading has closed for this market.",
  creator_cannot_trade_own_market: "You cannot trade in a market you created.",
  credits_account_required: "Your credit account is still being set up. Try again shortly.",
  insufficient_credits: "You do not have enough credits for this trade.",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function friendlyError(error: unknown): string {
  const raw = String((error as { message?: string })?.message ?? error ?? "");
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (raw.includes(key)) return ERROR_MESSAGES[key];
  }
  return "Something went wrong. Please try again.";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

async function fetchSpotPrice(symbol: string): Promise<number | null> {
  const id = SYMBOL_TO_ID[symbol.toUpperCase()];
  if (!id) return null;
  try {
    const res = await fetch(`${COINGECKO_API}/simple/price?ids=${id}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.[id]?.usd;
    return isFiniteNumber(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }

    // Every action requires a verified signed-in user, including settlement sweeps.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return json({ error: "Please sign in to continue." }, 401);
    }

    const action = String(body.action ?? "");

    // ---- Settlement sweep ----
    if (action === "settle_due") {
      const parsed = SettleDueSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid request." }, 400);

      const { data: due, error } = await serviceClient
        .from("prediction_markets")
        .select("id, asset_symbol, target_price, direction, resolution_source, resolve_at, status")
        .in("status", ["open", "closed"])
        .lte("resolve_at", new Date().toISOString())
        .limit(25);

      if (error) throw error;

      const settled: string[] = [];
      const needsReview: string[] = [];

      for (const market of due ?? []) {
        if (market.resolution_source !== "coingecko") {
          await serviceClient.from("prediction_markets").update({ status: "review" }).eq("id", market.id);
          needsReview.push(market.id);
          continue;
        }

        const price = await fetchSpotPrice(market.asset_symbol);
        if (price === null) {
          await serviceClient.from("prediction_markets").update({ status: "review" }).eq("id", market.id);
          needsReview.push(market.id);
          continue;
        }

        const target = Number(market.target_price);
        const outcome = market.direction === "above"
          ? (price > target ? "yes" : "no")
          : (price < target ? "yes" : "no");

        const { error: settleError } = await serviceClient.rpc("settle_prediction_market", {
          _market_id: market.id,
          _outcome: outcome,
          _observed_price: price,
          _note: `Settled from CoinGecko spot price for ${market.asset_symbol}.`,
        });

        if (settleError) {
          await serviceClient.from("prediction_markets").update({ status: "review" }).eq("id", market.id);
          needsReview.push(market.id);
          continue;
        }
        settled.push(market.id);
      }

      await serviceClient
        .from("prediction_markets")
        .update({ status: "closed" })
        .eq("status", "open")
        .lte("close_at", new Date().toISOString())
        .gt("resolve_at", new Date().toISOString());

      return json({ settled: settled.length, needsReview: needsReview.length });
    }

    if (action === "create_market") {
      const parsed = CreateMarketSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Please check the market details and try again." }, 400);
      const { question, assetSymbol, targetPrice, direction, closeAt, resolveAt } = parsed.data;
      const closeTime = Date.parse(closeAt);
      const resolveTime = Date.parse(resolveAt);
      if (closeTime <= Date.now() || resolveTime <= closeTime) {
        return json({ error: ERROR_MESSAGES.invalid_market_times }, 400);
      }

      const { data, error } = await serviceClient.rpc("create_prediction_market", {
        _user_id: user.id,
        _question: question,
        _asset_symbol: assetSymbol,
        _target_price: targetPrice,
        _direction: direction,
        _close_at: new Date(closeTime).toISOString(),
        _resolve_at: new Date(resolveTime).toISOString(),
        _resolution_source: "coingecko",
      });

      if (error) return json({ error: friendlyError(error) }, 400);
      return json({ marketId: data });
    }

    if (action === "place_order") {
      const parsed = PlaceOrderSchema.safeParse(body);
      if (!parsed.success) return json({ error: ERROR_MESSAGES.invalid_order }, 400);
      const { marketId, side, price, quantity } = parsed.data;

      const { data, error } = await serviceClient.rpc("place_prediction_order", {
        _user_id: user.id,
        _market_id: marketId,
        _side: side,
        _price: price,
        _quantity: quantity,
      });

      if (error) return json({ error: friendlyError(error) }, 400);
      return json({ result: data });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    console.error("prediction-markets error:", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
