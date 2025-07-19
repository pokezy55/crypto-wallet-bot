import { getProvider, getTokenList } from '../../../lib/chain';
import { formatEther, formatUnits, isAddress, Contract, getAddress } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)'
];

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
      try {
        let bal;
        if (token.isNative) {
          bal = await provider.getBalance(normalizedAddress);
          bal = formatEther(bal);
        } else {
          if (!token.address) {
            throw new Error(`Token ${token.symbol} has no contract address`);
          }
          const contract = new Contract(token.address, ERC20_ABI, provider);
          bal = await contract.balanceOf(normalizedAddress);
          bal = formatUnits(bal, token.decimals || 18);
        }
        balances.push({ symbol: token.symbol, balance: bal });
      } catch (e) {
        console.warn(`Error fetching balance for ${token.symbol}:`, e.message);
        errors.push({ symbol: token.symbol, error: e.message });
        // Add token with 0 balance instead of failing
        balances.push({ symbol: token.symbol, balance: '0' });
      }
    }

    // If we have some successful balances, return them even if some failed
    if (balances.length > 0) {
      return Response.json({ 
        balances,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // If all tokens failed, return error
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