# DeFi Lending Protocol - Deployment Guide

## Quick Start

### 1. Install Hardhat Dependencies
```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox hardhat dotenv
```

### 2. Compile Contracts
```bash
npx hardhat compile
```

### 3. Start Local Node
```bash
# In a new terminal
npx hardhat node
```

### 4. Deploy to Local Network
```bash
npx hardhat run --network localhost scripts/deploy.js
```

### 5. Copy Contract Artifacts
```bash
chmod +x scripts/setup-frontend.sh
./scripts/setup-frontend.sh
```

### 6. Update Contract Addresses
After deployment, copy the printed addresses and update `src/config/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  LENDING_POOL: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Your deployed address
  PRICE_ORACLE: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Your deployed address
  USDC: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // Your deployed address
  USDT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // Your deployed address
} as const;
```

### 7. Start Frontend
```bash
npm run dev
```

## Testing the Application

1. **Connect Wallet**: Use MetaMask with one of the Hardhat accounts
2. **Get Test Tokens**: The deploy script automatically funds the deployer with USDC/USDT
3. **Add More Funds**: Use the faucet functions on the mock tokens
4. **Test Flows**: 
   - Deposit ETH/USDC/USDT as collateral
   - Borrow against collateral
   - Repay loans
   - Withdraw collateral

## MetaMask Setup for Local Testing

1. Add Localhost Network:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import Hardhat Account:
   - Copy private key from `npx hardhat node` output
   - Import into MetaMask

## Deploy to Testnet (Sepolia)

1. Create `.env` file:
```
SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
DEPLOYER_KEY=your_private_key_here
```

2. Deploy:
```bash
npx hardhat run --network sepolia scripts/deploy.js
```

3. Update contract addresses in frontend

## Troubleshooting

- **"No wallet found"**: Ensure MetaMask is installed and unlocked
- **Transaction fails**: Check account has enough ETH for gas
- **Wrong network**: Switch MetaMask to localhost (Chain ID 31337)
- **Contract not found**: Ensure addresses in config match deployment output