export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  aTokenAddress: string;
  debtTokenAddress: string;
  supplyAPY: number;
  borrowAPY: number;
  totalSupply: string;
  totalBorrow: string;
  liquidationThreshold: number;
  ltv: number;
}

export const SUPPORTED_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logo: '/lovable-uploads/ethereum-logo.png',
    aTokenAddress: '0x3456789012345678901234567890123456789012',
    debtTokenAddress: '0x4567890123456789012345678901234567890123',
    supplyAPY: 2.5,
    borrowAPY: 4.2,
    totalSupply: '1234567.89',
    totalBorrow: '987654.32',
    liquidationThreshold: 80,
    ltv: 75,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x5678901234567890123456789012345678901234',
    decimals: 6,
    logo: '/lovable-uploads/usdc-logo.png',
    aTokenAddress: '0x6789012345678901234567890123456789012345',
    debtTokenAddress: '0x7890123456789012345678901234567890123456',
    supplyAPY: 8.5,
    borrowAPY: 12.3,
    totalSupply: '5678901.23',
    totalBorrow: '3456789.01',
    liquidationThreshold: 85,
    ltv: 80,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x8901234567890123456789012345678901234567',
    decimals: 6,
    logo: '/lovable-uploads/usdt-logo.png',
    aTokenAddress: '0x9012345678901234567890123456789012345678',
    debtTokenAddress: '0x0123456789012345678901234567890123456789',
    supplyAPY: 7.8,
    borrowAPY: 11.5,
    totalSupply: '8901234.56',
    totalBorrow: '5678901.23',
    liquidationThreshold: 85,
    ltv: 80,
  },
];

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return SUPPORTED_TOKENS.find(token => token.symbol === symbol);
};

export const getTokenByAddress = (address: string): Token | undefined => {
  return SUPPORTED_TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase());
};