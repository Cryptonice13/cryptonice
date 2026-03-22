import { formatUnits, parseUnits } from 'viem';

export const formatBalance = (balance: bigint, decimals: number = 18, precision: number = 4): string => {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  return num.toFixed(precision);
};

export const formatCurrency = (amount: string | number, currency: string = 'USD'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPercentage = (value: number, precision: number = 2): string => {
  return `${value.toFixed(precision)}%`;
};

export const formatAPY = (apy: number): string => {
  return formatPercentage(apy);
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toFixed(2);
};

export const parseTokenAmount = (amount: string, decimals: number = 18): bigint => {
  return parseUnits(amount, decimals);
};

export const formatHealthFactor = (healthFactor: bigint): string => {
  const hf = parseFloat(formatUnits(healthFactor, 18));
  if (hf >= 10) return '10+';
  return hf.toFixed(2);
};

export const getHealthFactorColor = (healthFactor: number): string => {
  if (healthFactor >= 2) return 'text-green-500';
  if (healthFactor >= 1.5) return 'text-yellow-500';
  if (healthFactor >= 1.1) return 'text-orange-500';
  return 'text-red-500';
};

export const formatPrice = (price: number): string => {
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  if (price >= 0.0001) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
};