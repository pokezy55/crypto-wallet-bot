const { JsonRpcProvider } = require('ethers');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const CHAINS = {
  eth: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      {
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
      },
      {
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
      },
    ],
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    nativeSymbol: 'MATIC',
    tokens: [
      {
        symbol: 'USDT',
        address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
        decimals: 6,
      },
      {
        symbol: 'USDC',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6,
      },
    ],
  },
  bsc: {
    chainId: 56,
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/', // BSC tidak pakai Alchemy
    nativeSymbol: 'BNB',
    tokens: [
      {
        symbol: 'USDT',
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
      },
      {
        symbol: 'USDC',
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        decimals: 18,
      },
    ],
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      {
        symbol: 'USDbC',
        address: '0xd9AAEC86B65d86f6A7B5B1b0c42FFA531710b6CA',
        decimals: 6,
      },
    ],
  },
};

function getChain(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error('Unknown chain');
  if (chain.rpcUrl.includes('undefined') || chain.rpcUrl.includes('null')) {
    throw new Error('Alchemy API key not set');
  }
  return chain;
}

function getProvider(chainKey) {
  const chain = getChain(chainKey);
  return new JsonRpcProvider(chain.rpcUrl);
}

function getTokenList(chainKey) {
  const chain = getChain(chainKey);
  return [
    { symbol: chain.nativeSymbol, address: null, decimals: 18, isNative: true },
    ...chain.tokens.map(t => ({ ...t, isNative: false })),
  ];
}

module.exports = {
  CHAINS,
  getChain,
  getProvider,
  getTokenList,
}; 