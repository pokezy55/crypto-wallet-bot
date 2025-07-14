const ALCHEMY_API_KEYS = {
  eth: process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a',
  polygon: process.env.ALCHEMY_POLYGON_API_KEY || process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a',
  bsc: process.env.ALCHEMY_BSC_API_KEY || process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a',
  base: process.env.ALCHEMY_BASE_API_KEY || process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a',
}

const ALCHEMY_BASE_URLS = {
  eth: `https://eth-mainnet.g.alchemy.com/v2/`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/`,
  bsc: `https://bsc-mainnet.g.alchemy.com/v2/`,
  base: `https://base-mainnet.g.alchemy.com/v2/`,
}

function getAlchemyUrl(chain) {
  const key = (chain || 'eth').toLowerCase();
  return (ALCHEMY_BASE_URLS[key] || ALCHEMY_BASE_URLS.eth) + (ALCHEMY_API_KEYS[key] || ALCHEMY_API_KEYS.eth);
}

// Fungsi untuk fetch ETH/native balance
export async function fetchEthBalance(address, chain = 'eth') {
  const url = getAlchemyUrl(chain);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
  })
  if (!res.ok) {
    console.error('Alchemy fetchEthBalance error', chain, await res.text())
    return 0
  }
  const data = await res.json()
  if (data.error) {
    console.error('Alchemy fetchEthBalance error', chain, data.error)
    return 0
  }
  if (data.result) {
    return parseInt(data.result, 16) / 1e18
  }
  return 0
}

const TOKEN_ADDRESSES = {
  eth: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    BNB: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    POL: '0x9992Ec3e6cA6b017cD5cF6a8637C6C2bA7eD7b72',
    BASE: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
  },
  polygon: {
    USDT: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
    BNB: '',
    POL: '',
    BASE: '',
  },
  bsc: {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BNB: '',
    POL: '',
    BASE: '',
  },
  base: {
    USDT: '',
    BNB: '',
    POL: '',
    BASE: '',
  }
}

export async function fetchErc20Balance(address, symbol, chain = 'eth') {
  const contract = TOKEN_ADDRESSES[chain]?.[symbol]
  if (!contract) return 0
  const url = getAlchemyUrl(chain);
  const data = '0x70a08231000000000000000000000000' + address.replace('0x', '')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [
        {
          to: contract,
          data
        },
        'latest'
      ]
    })
  })
  if (!res.ok) {
    console.error('Alchemy fetchErc20Balance error', chain, await res.text())
    return 0
  }
  const result = await res.json()
  if (result.error) {
    console.error('Alchemy fetchErc20Balance error', chain, result.error)
    return 0
  }
  if (result.result) {
    const decimals = symbol === 'USDT' ? 6 : 18
    return parseInt(result.result, 16) / 10 ** decimals
  }
  return 0
}

// Fungsi untuk fetch transaction history (Alchemy Transfers API v2)
export async function fetchTransactionHistory(address, chain = 'eth') {
  const url = getAlchemyUrl(chain);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: '0x0',
        toBlock: 'latest',
        toAddress: address,
        category: ['external', 'erc20', 'erc721', 'erc1155', 'internal', 'token'],
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: '0x32'
      }]
    })
  });
  if (!res.ok) {
    console.error('Alchemy fetchTransactionHistory error', chain, await res.text())
    return []
  }
  const data = await res.json();
  if (data.error) {
    console.error('Alchemy fetchTransactionHistory error', chain, data.error)
    return []
  }
  return data.result?.transfers || [];
} 