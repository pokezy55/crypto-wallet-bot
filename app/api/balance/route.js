import { getProvider, getTokenList } from '../../../lib/chain';
import { formatEther, formatUnits, Contract, getAddress } from 'ethers';
import { fetchPrices } from '../../../lib/crypto-prices';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)'
];

// In-memory cache for balances (per wallet+chain+token, 60s)
const balanceCache = {};
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCacheKey(address, chain, symbol) {
  return `${address.toLowerCase()}_${chain}_${symbol.toUpperCase()}`;
}

export async function POST(request) {
  try {
    const { address, chain } = await request.json();
    if (!address || !chain) {
      return Response.json({ error: 'Missing address or chain' }, { status: 400 });
    }

    // Validate & normalize address
    let normalizedAddress;
    try {
      normalizedAddress = getAddress(address); // This will validate & checksum the address
    } catch (e) {
      console.warn('Address validation error:', e.message);
      return Response.json({ error: 'Invalid address format' }, { status: 400 });
    }

    let provider, tokens;
    try {
      provider = getProvider(chain);
      tokens = getTokenList(chain);
    } catch (e) {
      console.warn('Chain/provider error:', e.message);
      return Response.json({ error: e.message }, { status: 400 });
    }

    const balances = {};
    const errors = [];
    const priceTokens = [];

    for (const token of tokens) {
      const cacheKey = getCacheKey(normalizedAddress, chain, token.symbol);
      const now = Date.now();
      // Use cache if not expired
      if (balanceCache[cacheKey] && (now - balanceCache[cacheKey].ts < CACHE_TTL)) {
        balances[token.symbol] = balanceCache[cacheKey].balance;
        if (token.priceId) priceTokens.push(token);
        continue;
      }
      let bal = '0';
      if (!token.address) {
        // Native token
        try {
          const rawBal = await provider.getBalance(normalizedAddress);
          bal = formatEther(rawBal);
        } catch (err) {
          console.warn(`Error fetching ${token.symbol} native balance:`, err.message);
          bal = '0';
        }
      } else {
        // ERC20 token: always validate contract address
        let checksumAddress;
        try {
          checksumAddress = getAddress(token.address);
        } catch (err) {
          console.warn(`Invalid contract address for ${token.symbol}:`, token.address, err.message);
          bal = '0';
          balances[token.symbol] = bal;
          balanceCache[cacheKey] = { balance: bal, ts: now };
          continue;
        }
        try {
          const contract = new Contract(checksumAddress, ERC20_ABI, provider);
          const rawBal = await contract.balanceOf(normalizedAddress);
          bal = formatUnits(rawBal, token.decimals || 18);
        } catch (err) {
          console.warn(`Error fetching ${token.symbol} balance:`, checksumAddress, err.message);
          bal = '0';
        }
      }
      balances[token.symbol] = bal;
      balanceCache[cacheKey] = { balance: bal, ts: now };
      if (token.priceId) priceTokens.push(token);
    }

    // Fetch prices and calculate totalUSD
    let totalUSD = 0;
    if (priceTokens.length > 0) {
      try {
        const prices = await fetchPrices(priceTokens);
        for (const token of priceTokens) {
          const symbol = token.symbol;
          const bal = parseFloat(balances[symbol] || '0');
          const price = prices[symbol.toLowerCase()]?.priceUSD || 0;
          totalUSD += bal * price;
        }
      } catch (e) {
        console.warn('Error fetching prices:', e.message);
      }
    }

    return Response.json({
      chain,
      balances,
      totalUSD: Number(totalUSD.toFixed(6))
    });
  } catch (e) {
    console.error('Balance API error:', e);
    return Response.json({
      error: 'Internal server error',
      message: e.message
    }, { status: 500 });
  }
} 