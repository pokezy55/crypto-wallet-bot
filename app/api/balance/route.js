import { getProvider, getTokenList } from '../../../lib/chain';
import { formatEther, formatUnits, isAddress, Contract, getAddress } from 'ethers';
import { safeGetAddress } from '../../../lib/crypto-alchemy';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)'
];

// --- PATCH: In-memory cache for balances (per wallet+chain+token, 60s) ---
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

    const balances = [];
    const errors = [];

    for (const token of tokens) {
      const cacheKey = getCacheKey(normalizedAddress, chain, token.symbol);
      const now = Date.now();
      // Use cache if not expired
      if (balanceCache[cacheKey] && (now - balanceCache[cacheKey].ts < CACHE_TTL)) {
        balances.push({ symbol: token.symbol, balance: balanceCache[cacheKey].balance });
        continue;
      }
      try {
        let bal = '0';
        if (!token.address) {
          // Native token
          bal = await provider.getBalance(normalizedAddress);
          bal = formatEther(bal);
        } else {
          // ERC20: always use safeGetAddress
          const checksumAddress = safeGetAddress(token.address);
          try {
            const contract = new Contract(checksumAddress, ERC20_ABI, provider);
            bal = await contract.balanceOf(normalizedAddress);
            bal = formatUnits(bal, token.decimals || 18);
          } catch (err) {
            console.warn('Error fetching ERC20 balance:', token.symbol, checksumAddress, err.message);
            errors.push({ symbol: token.symbol, error: err.message });
            bal = '0';
          }
        }
        balances.push({ symbol: token.symbol, balance: bal });
        balanceCache[cacheKey] = { balance: bal, ts: now };
      } catch (e) {
        console.warn(`Error fetching balance for ${token.symbol}:`, e.message);
        errors.push({ symbol: token.symbol, error: e.message });
        balances.push({ symbol: token.symbol, balance: '0' });
        balanceCache[cacheKey] = { balance: '0', ts: now };
      }
    }

    if (balances.length > 0) {
      return Response.json({ 
        balances,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    return Response.json({ 
      error: 'Failed to fetch any token balances',
      details: errors
    }, { status: 500 });

  } catch (e) {
    console.error('Balance API error:', e);
    return Response.json({ 
      error: 'Internal server error',
      message: e.message
    }, { status: 500 });
  }
} 