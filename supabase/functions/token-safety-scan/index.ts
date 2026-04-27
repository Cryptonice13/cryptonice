import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map UI chain name -> GoPlus chain id
const CHAIN_IDS: Record<string, string> = {
  ethereum: "1",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
  optimism: "10",
  base: "8453",
  avalanche: "43114",
  fantom: "250",
};

// Map UI chain -> DexScreener slug
const DEX_CHAINS: Record<string, string> = {
  ethereum: "ethereum",
  bsc: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanche",
  fantom: "fantom",
};

interface Factor {
  key: string;
  label: string;
  severity: "good" | "info" | "warning" | "danger" | "critical";
  value: string;
  description: string;
  weight: number; // contribution to risk (0-100)
}

const isAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a.trim());

async function fetchGoPlus(chainId: string, contract: string) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${contract.toLowerCase()}`;
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.result?.[contract.toLowerCase()] || null;
  } catch (e) {
    console.error("GoPlus error:", e);
    return null;
  }
}

async function fetchDexScreener(chain: string, contract: string) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contract}`);
    if (!r.ok) return null;
    const d = await r.json();
    const pairs = (d?.pairs || []).filter((p: any) =>
      !chain || p.chainId === chain
    );
    if (pairs.length === 0) return null;
    // Pick highest liquidity pair
    pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    return pairs[0];
  } catch (e) {
    console.error("DexScreener error:", e);
    return null;
  }
}

function analyzeFactors(gp: any, dex: any): { factors: Factor[]; score: number } {
  const factors: Factor[] = [];
  let score = 0;

  if (!gp) {
    factors.push({
      key: "no_data",
      label: "No on-chain data",
      severity: "warning",
      value: "Unknown",
      description: "Unable to fetch security data for this contract. Treat with extreme caution.",
      weight: 30,
    });
    score += 30;
  } else {
    // Honeypot — buy/sell tax block
    if (gp.is_honeypot === "1") {
      factors.push({
        key: "honeypot",
        label: "Honeypot detected",
        severity: "critical",
        value: "YES",
        description: "Contract prevents selling. You can buy but cannot sell. DO NOT trade.",
        weight: 50,
      });
      score += 50;
    } else if (gp.is_honeypot === "0") {
      factors.push({
        key: "honeypot",
        label: "Honeypot check",
        severity: "good",
        value: "Pass",
        description: "Contract allows both buying and selling.",
        weight: 0,
      });
    }

    // Mintable
    if (gp.is_mintable === "1") {
      factors.push({
        key: "mintable",
        label: "Mintable supply",
        severity: "danger",
        value: "YES",
        description: "Owner can mint unlimited new tokens, diluting your holdings to zero.",
        weight: 18,
      });
      score += 18;
    }

    // Owner can change balance / blacklist
    if (gp.owner_change_balance === "1") {
      factors.push({
        key: "owner_balance",
        label: "Owner can edit balances",
        severity: "critical",
        value: "YES",
        description: "Owner can rewrite any holder's balance. Extreme rug risk.",
        weight: 40,
      });
      score += 40;
    }
    if (gp.is_blacklisted === "1") {
      factors.push({
        key: "blacklist",
        label: "Blacklist function",
        severity: "danger",
        value: "Active",
        description: "Owner can blacklist wallets, freezing them from selling.",
        weight: 15,
      });
      score += 15;
    }

    // Buy/Sell tax
    const buyTax = parseFloat(gp.buy_tax || "0") * 100;
    const sellTax = parseFloat(gp.sell_tax || "0") * 100;
    if (sellTax >= 50) {
      factors.push({
        key: "sell_tax",
        label: "Sell tax",
        severity: "critical",
        value: `${sellTax.toFixed(1)}%`,
        description: "Extreme sell tax — effectively unsellable.",
        weight: 30,
      });
      score += 30;
    } else if (sellTax >= 10) {
      factors.push({
        key: "sell_tax",
        label: "Sell tax",
        severity: "warning",
        value: `${sellTax.toFixed(1)}%`,
        description: "High sell tax will eat into your profits.",
        weight: 10,
      });
      score += 10;
    } else if (sellTax > 0) {
      factors.push({
        key: "sell_tax",
        label: "Sell tax",
        severity: "info",
        value: `${sellTax.toFixed(1)}%`,
        description: "Small sell tax detected.",
        weight: 2,
      });
      score += 2;
    }
    if (buyTax >= 10) {
      factors.push({
        key: "buy_tax",
        label: "Buy tax",
        severity: "warning",
        value: `${buyTax.toFixed(1)}%`,
        description: "High buy tax.",
        weight: 8,
      });
      score += 8;
    }

    // Proxy / upgradeable
    if (gp.is_proxy === "1") {
      factors.push({
        key: "proxy",
        label: "Upgradeable proxy",
        severity: "warning",
        value: "YES",
        description: "Contract logic can be replaced by the owner — behaviour can change anytime.",
        weight: 12,
      });
      score += 12;
    }

    // Open source
    if (gp.is_open_source === "0") {
      factors.push({
        key: "open_source",
        label: "Source code",
        severity: "danger",
        value: "Not verified",
        description: "Contract source is not published. Cannot audit what the contract really does.",
        weight: 20,
      });
      score += 20;
    } else if (gp.is_open_source === "1") {
      factors.push({
        key: "open_source",
        label: "Source code",
        severity: "good",
        value: "Verified",
        description: "Contract is verified and human-readable.",
        weight: 0,
      });
    }

    // Owner concentration
    const ownerPct = parseFloat(gp.owner_percent || "0") * 100;
    if (ownerPct >= 50) {
      factors.push({
        key: "owner_concentration",
        label: "Owner holdings",
        severity: "critical",
        value: `${ownerPct.toFixed(1)}%`,
        description: "Owner holds majority supply — single dump can wipe price.",
        weight: 25,
      });
      score += 25;
    } else if (ownerPct >= 10) {
      factors.push({
        key: "owner_concentration",
        label: "Owner holdings",
        severity: "warning",
        value: `${ownerPct.toFixed(1)}%`,
        description: "Owner holds significant supply.",
        weight: 10,
      });
      score += 10;
    }

    // Top 10 holders concentration
    const top10 = (gp.holders || []).slice(0, 10).reduce(
      (s: number, h: any) => s + parseFloat(h.percent || "0"), 0
    ) * 100;
    if (top10 >= 70) {
      factors.push({
        key: "holder_concentration",
        label: "Top 10 holders",
        severity: "danger",
        value: `${top10.toFixed(1)}%`,
        description: "Whales control the float. Coordinated dumps likely.",
        weight: 18,
      });
      score += 18;
    } else if (top10 >= 40) {
      factors.push({
        key: "holder_concentration",
        label: "Top 10 holders",
        severity: "warning",
        value: `${top10.toFixed(1)}%`,
        description: "Holdings are concentrated.",
        weight: 8,
      });
      score += 8;
    }

    // Ownership renounced / hidden owner
    if (gp.hidden_owner === "1") {
      factors.push({
        key: "hidden_owner",
        label: "Hidden owner",
        severity: "danger",
        value: "YES",
        description: "Contract has a hidden owner with secret privileges.",
        weight: 20,
      });
      score += 20;
    }
    if (gp.can_take_back_ownership === "1") {
      factors.push({
        key: "take_back_owner",
        label: "Reclaim ownership",
        severity: "danger",
        value: "YES",
        description: "Renounced owner can be reclaimed.",
        weight: 18,
      });
      score += 18;
    }

    // Trading restrictions
    if (gp.cannot_sell_all === "1") {
      factors.push({
        key: "cannot_sell_all",
        label: "Cannot sell 100%",
        severity: "danger",
        value: "YES",
        description: "Holders cannot sell their entire balance.",
        weight: 20,
      });
      score += 20;
    }
    if (gp.transfer_pausable === "1") {
      factors.push({
        key: "pausable",
        label: "Transfers pausable",
        severity: "warning",
        value: "YES",
        description: "Owner can pause all transfers, locking your tokens.",
        weight: 10,
      });
      score += 10;
    }
    if (gp.trading_cooldown === "1") {
      factors.push({
        key: "cooldown",
        label: "Trade cooldown",
        severity: "info",
        value: "YES",
        description: "Buy/sell cooldown enforced between trades.",
        weight: 3,
      });
      score += 3;
    }
    if (gp.is_anti_whale === "1") {
      factors.push({
        key: "anti_whale",
        label: "Anti-whale limit",
        severity: "info",
        value: "YES",
        description: "Per-wallet or per-tx cap enforced.",
        weight: 2,
      });
      score += 2;
    }

    // LP locked check (token info often empty if no LP found)
    if (gp.lp_holders && gp.lp_holders.length > 0) {
      const locked = gp.lp_holders.some((h: any) => h.is_locked === 1 || h.is_locked === "1");
      if (locked) {
        factors.push({
          key: "lp_locked",
          label: "Liquidity locked",
          severity: "good",
          value: "YES",
          description: "Liquidity pool tokens are locked or burned.",
          weight: 0,
        });
      } else {
        factors.push({
          key: "lp_locked",
          label: "Liquidity locked",
          severity: "danger",
          value: "NO",
          description: "LP is not locked — owner can pull liquidity (rug pull).",
          weight: 25,
        });
        score += 25;
      }
    }
  }

  // DEX liquidity & age
  if (dex) {
    const liq = dex.liquidity?.usd || 0;
    const vol24h = dex.volume?.h24 || 0;
    const created = dex.pairCreatedAt ? new Date(dex.pairCreatedAt) : null;
    const ageDays = created ? (Date.now() - created.getTime()) / 86400000 : 0;

    if (liq < 5000) {
      factors.push({
        key: "liquidity",
        label: "Liquidity",
        severity: "critical",
        value: `$${liq.toFixed(0)}`,
        description: "Almost no liquidity — any trade will move price massively.",
        weight: 25,
      });
      score += 25;
    } else if (liq < 50000) {
      factors.push({
        key: "liquidity",
        label: "Liquidity",
        severity: "warning",
        value: `$${(liq / 1000).toFixed(1)}K`,
        description: "Low liquidity — high slippage risk.",
        weight: 10,
      });
      score += 10;
    } else {
      factors.push({
        key: "liquidity",
        label: "Liquidity",
        severity: "good",
        value: `$${(liq / 1000).toFixed(0)}K`,
        description: "Adequate liquidity for trading.",
        weight: 0,
      });
    }

    if (ageDays < 1) {
      factors.push({
        key: "age",
        label: "Pair age",
        severity: "danger",
        value: `${(ageDays * 24).toFixed(0)}h`,
        description: "Pair is brand new — very high rug risk in first 24h.",
        weight: 15,
      });
      score += 15;
    } else if (ageDays < 7) {
      factors.push({
        key: "age",
        label: "Pair age",
        severity: "warning",
        value: `${ageDays.toFixed(1)}d`,
        description: "Pair is less than a week old.",
        weight: 6,
      });
      score += 6;
    } else {
      factors.push({
        key: "age",
        label: "Pair age",
        severity: "good",
        value: `${Math.floor(ageDays)}d`,
        description: "Pair has trading history.",
        weight: 0,
      });
    }

    factors.push({
      key: "volume",
      label: "24h volume",
      severity: vol24h < 1000 ? "warning" : "info",
      value: vol24h >= 1000 ? `$${(vol24h / 1000).toFixed(1)}K` : `$${vol24h.toFixed(0)}`,
      description: vol24h < 1000 ? "Very low trading activity." : "Has trading activity.",
      weight: vol24h < 1000 ? 5 : 0,
    });
    if (vol24h < 1000) score += 5;
  } else {
    factors.push({
      key: "no_dex",
      label: "DEX listing",
      severity: "warning",
      value: "Not found",
      description: "No DEX pair found. Token may be unlisted or on an unsupported DEX.",
      weight: 10,
    });
    score += 10;
  }

  return { factors, score: Math.min(100, Math.round(score)) };
}

function levelFromScore(score: number) {
  if (score >= 75) return { level: "critical", recommendation: "AVOID" };
  if (score >= 50) return { level: "high", recommendation: "AVOID" };
  if (score >= 30) return { level: "medium", recommendation: "CAUTION" };
  if (score >= 15) return { level: "low", recommendation: "CAUTION" };
  return { level: "safe", recommendation: "BUY_OK" };
}

async function aiVerdict(symbol: string, name: string, score: number, level: string, factors: Factor[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const factorsCtx = factors
    .filter(f => f.severity !== "good")
    .map(f => `- ${f.label}: ${f.value} (${f.severity}) — ${f.description}`)
    .join("\n") || "All checks passed.";

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a blunt crypto rug-pull analyst. In 2-3 plain-English sentences, give a verdict for a retail user. No jargon. Be direct: should they touch this or not? Lead with the conclusion.",
          },
          {
            role: "user",
            content: `Token: ${name || symbol || "Unknown"} (${symbol || "?"})\nRisk score: ${score}/100 (${level})\n\nFindings:\n${factorsCtx}\n\nWrite the verdict.`,
          },
        ],
      }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("AI verdict error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contract, chain = "ethereum", userId, walletAddress, force = false } =
      await req.json() as {
        contract: string;
        chain?: string;
        userId?: string;
        walletAddress?: string;
        force?: boolean;
      };

    if (!contract || !isAddress(contract)) {
      return new Response(JSON.stringify({ error: "Invalid contract address. Must be 0x followed by 40 hex chars." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chainKey = (chain || "ethereum").toLowerCase();
    const chainId = CHAIN_IDS[chainKey];
    if (!chainId) {
      return new Response(JSON.stringify({ error: `Unsupported chain: ${chain}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const contractLower = contract.toLowerCase();

    // Cache lookup (24h) — saves credits
    if (!force) {
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("safety_scans")
        .select("*")
        .eq("contract_address", contractLower)
        .eq("chain", chainKey)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cached && cached.length > 0) {
        return new Response(JSON.stringify({ scan: cached[0], cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch live
    const [gp, dex] = await Promise.all([
      fetchGoPlus(chainId, contract),
      fetchDexScreener(DEX_CHAINS[chainKey] || chainKey, contract),
    ]);

    const tokenName = gp?.token_name || dex?.baseToken?.name || null;
    const tokenSymbol = gp?.token_symbol || dex?.baseToken?.symbol || null;
    const tokenLogo = dex?.info?.imageUrl || null;

    const { factors, score } = analyzeFactors(gp, dex);
    const { level, recommendation } = levelFromScore(score);

    const verdict = await aiVerdict(tokenSymbol || "", tokenName || "", score, level, factors);

    const insertRow: any = {
      contract_address: contractLower,
      chain: chainKey,
      token_name: tokenName,
      token_symbol: tokenSymbol,
      token_logo: tokenLogo,
      risk_score: score,
      risk_level: level,
      ai_verdict: verdict,
      recommendation,
      factors,
      goplus_data: gp,
      dex_data: dex,
    };
    if (userId) insertRow.user_id = userId;
    else if (walletAddress) insertRow.wallet_address = walletAddress;

    const { data: saved, error: insertErr } = await supabase
      .from("safety_scans")
      .insert(insertRow)
      .select()
      .single();

    if (insertErr) console.error("Insert safety_scans error:", insertErr);

    return new Response(JSON.stringify({ scan: saved || insertRow, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("token-safety-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
