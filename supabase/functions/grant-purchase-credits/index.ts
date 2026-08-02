import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS: Record<string, number> = {
  basic: 150,
  pro: 800,
  enterprise: 3500,
};

const COUPON_CODE = "CryptoAI";
const COUPON_BONUS = 0.2;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan, coupon } = await req.json();
    const base = PLANS[String(plan)];
    if (!base) {
      return new Response(JSON.stringify({ error: "Unknown plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valid = typeof coupon === "string" && coupon.toUpperCase() === COUPON_CODE.toUpperCase();
    const credits = valid ? Math.floor(base * (1 + COUPON_BONUS)) : base;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: balance, error } = await admin.rpc("add_credits", {
      _user_id: user.id,
      _wallet: null,
      _amount: credits,
      _type: "purchase",
      _description: `Purchased ${plan} plan - ${credits} credits`,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ balance, credits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grant-purchase-credits error:", e);
    return new Response(JSON.stringify({ error: "Purchase failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
