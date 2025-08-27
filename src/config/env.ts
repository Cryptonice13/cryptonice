export const ENV = {
  INFURA_PROJECT_ID: import.meta.env.VITE_INFURA_PROJECT_ID || '',
  ALCHEMY_API_KEY: import.meta.env.VITE_ALCHEMY_API_KEY || '',
  WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8b4f3a9e2c1d6f7a9b8c3e4d5f6a7b8c',
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID) || 1,
  IS_TESTNET: import.meta.env.VITE_IS_TESTNET === 'true',
} as const;

export const getRPCUrl = () => {
  if (ENV.ALCHEMY_API_KEY) {
    return `https://eth-mainnet.g.alchemy.com/v2/${ENV.ALCHEMY_API_KEY}`;
  }
  if (ENV.INFURA_PROJECT_ID) {
    return `https://mainnet.infura.io/v3/${ENV.INFURA_PROJECT_ID}`;
  }
  return 'https://ethereum.publicnode.com';
};