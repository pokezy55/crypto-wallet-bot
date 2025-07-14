import fetch from 'node-fetch'

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a'
const ALCHEMY_BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

// Fungsi untuk fetch ETH balance
export async function fetchEthBalance(address) {
  const res = await fetch(`${ALCHEMY_BASE_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
  })
  const data = await res.json()
  if (data.result) {
    return parseInt(data.result, 16) / 1e18
  }
  return 0
}

// Fungsi untuk fetch ERC20 balance (USDT, BNB, POL, BASE)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [ { name: '_owner', type: 'address' } ],
    name: 'balanceOf',
    outputs: [ { name: 'balance', type: 'uint256' } ],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [ { name: '', type: 'uint8' } ],
    type: 'function'
  }
]

const TOKEN_ADDRESSES = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  BNB: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  POL: '0x9992Ec3e6cA6b017cD5cF6a8637C6C2bA7eD7b72',
  BASE: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0' // contoh, ganti jika perlu
}

export async function fetchErc20Balance(address, symbol) {
  const contract = TOKEN_ADDRESSES[symbol]
  if (!contract) return 0
  // eth_call untuk balanceOf
  const data = '0x70a08231000000000000000000000000' + address.replace('0x', '')
  const res = await fetch(`${ALCHEMY_BASE_URL}`, {
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
  const result = await res.json()
  if (result.result) {
    // USDT, BNB, POL, BASE biasanya 18 desimal, USDT 6
    const decimals = symbol === 'USDT' ? 6 : 18
    return parseInt(result.result, 16) / 10 ** decimals
  }
  return 0
}

// Fungsi untuk fetch transaction history (Alchemy transfers API)
export async function fetchTransactionHistory(address) {
  const url = `https://dashboard.alchemy.com/api/v2/transfer?address=${address}&apiKey=${ALCHEMY_API_KEY}`
  // NOTE: Untuk production, gunakan Alchemy Transfers API v2 (lihat docs Alchemy)
  // Di sini hanya contoh, bisa diganti dengan endpoint yang benar jika perlu
  const res = await fetch(url)
  const data = await res.json()
  return data.transfers || []
} 