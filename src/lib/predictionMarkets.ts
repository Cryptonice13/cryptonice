import { z } from 'zod';

export const PREDICTION_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'ARB', name: 'Arbitrum' },
  { symbol: 'OP', name: 'Optimism' },
] as const;

export const SUPPORTED_SYMBOLS = PREDICTION_ASSETS.map(a => a.symbol) as string[];

export const SHARE_PAYOUT = 100;

export const createMarketSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(15, { message: 'Write a clear question of at least 15 characters.' })
      .max(240, { message: 'Keep the question under 240 characters.' }),
    assetSymbol: z
      .string()
      .trim()
      .toUpperCase()
      .refine(v => SUPPORTED_SYMBOLS.includes(v), { message: 'Choose a supported crypto asset.' }),
    targetPrice: z
      .number({ invalid_type_error: 'Enter a target price.' })
      .positive({ message: 'Target price must be greater than zero.' })
      .max(100_000_000, { message: 'Target price is too large.' }),
    direction: z.enum(['above', 'below'], { message: 'Choose above or below.' }),
    closeAt: z.string().min(1, { message: 'Choose when trading closes.' }),
    resolveAt: z.string().min(1, { message: 'Choose when the market settles.' }),
  })
  .superRefine((value, ctx) => {
    const close = Date.parse(value.closeAt);
    const resolve = Date.parse(value.resolveAt);
    if (!Number.isFinite(close) || close <= Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['closeAt'], message: 'Trading must close in the future.' });
    }
    if (!Number.isFinite(resolve) || resolve <= close) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['resolveAt'], message: 'Settlement must come after trading closes.' });
    }
  });

export const orderSchema = z.object({
  side: z.enum(['yes', 'no']),
  price: z
    .number({ invalid_type_error: 'Enter a price.' })
    .int({ message: 'Price must be a whole number of credits.' })
    .min(1, { message: 'Price must be at least 1 credit.' })
    .max(99, { message: 'Price must be 99 credits or less.' }),
  quantity: z
    .number({ invalid_type_error: 'Enter a number of shares.' })
    .int({ message: 'Shares must be a whole number.' })
    .min(1, { message: 'Buy at least 1 share.' })
    .max(10_000, { message: 'Buy 10,000 shares or fewer.' }),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;
export type OrderInput = z.infer<typeof orderSchema>;

export function impliedChance(priceCredits: number): string {
  return `${Math.round(priceCredits)}%`;
}

export function formatCredits(value: number): string {
  return `${Math.round(value).toLocaleString()} cr`;
}

export function marketStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Trading open';
    case 'closed':
      return 'Trading closed';
    case 'resolved':
      return 'Settled';
    case 'cancelled':
      return 'Cancelled';
    case 'review':
      return 'Needs review';
    default:
      return status;
  }
}
