// Map CoinGecko IDs / symbols → CCXT exchange symbol (BASE/QUOTE).
// Quote defaults to USDT (most universally listed). Coinbase uses USD for many.

const COINGECKO_TO_BASE: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tether: "USDT",
  "usd-coin": "USDC",
  binancecoin: "BNB",
  solana: "SOL",
  ripple: "XRP",
  cardano: "ADA",
  dogecoin: "DOGE",
  "tron": "TRX",
  "avalanche-2": "AVAX",
  "shiba-inu": "SHIB",
  polkadot: "DOT",
  chainlink: "LINK",
  "matic-network": "MATIC",
  polygon: "MATIC",
  "polygon-ecosystem-token": "POL",
  litecoin: "LTC",
  "bitcoin-cash": "BCH",
  "near": "NEAR",
  uniswap: "UNI",
  cosmos: "ATOM",
  aptos: "APT",
  arbitrum: "ARB",
  optimism: "OP",
  filecoin: "FIL",
  hedera: "HBAR",
  vechain: "VET",
  stellar: "XLM",
  algorand: "ALGO",
  monero: "XMR",
  "the-graph": "GRT",
  aave: "AAVE",
  maker: "MKR",
  "internet-computer": "ICP",
  "pepe": "PEPE",
  "sui": "SUI",
  "render-token": "RNDR",
  "render": "RENDER",
  "fantom": "FTM",
  "bonk": "BONK",
};

export interface ExchangeSymbolOpts {
  exchange?: string;
  preferredQuote?: string;
}

export function toExchangeSymbol(
  cgIdOrSymbol: string,
  opts: ExchangeSymbolOpts = {},
): string {
  const key = (cgIdOrSymbol || "").toLowerCase();
  const base =
    COINGECKO_TO_BASE[key] ??
    cgIdOrSymbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const quote =
    opts.preferredQuote ?? (opts.exchange === "coinbase" ? "USD" : "USDT");
  return `${base}/${quote}`;
}

export const SUPPORTED_EXCHANGES = [
  { id: "binance", label: "Binance", quote: "USDT" },
  { id: "coinbase", label: "Coinbase", quote: "USD" },
  { id: "kraken", label: "Kraken", quote: "USDT" },
  { id: "bybit", label: "Bybit", quote: "USDT" },
  { id: "okx", label: "OKX", quote: "USDT" },
] as const;

export type ExchangeId = (typeof SUPPORTED_EXCHANGES)[number]["id"];

export const SUPPORTED_TIMEFRAMES = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h", label: "1h" },
  { id: "4h", label: "4h" },
  { id: "1d", label: "1D" },
] as const;
export type Timeframe = (typeof SUPPORTED_TIMEFRAMES)[number]["id"];
