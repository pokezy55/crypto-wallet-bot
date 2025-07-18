import { getProvider, getTokenList } from '../../../lib/chain';
import { formatEther, formatUnits, isAddress, Contract, getAddress } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)'
];
const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://rpc.ankr.com/bsc';

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
    try {
      let nativeBalance = null;
      let erc20Balances = [];

      for (const token of tokens) {
        let bal;
        try {
          if (token.isNative) {
            bal = await provider.getBalance(normalizedAddress);
            bal = formatEther(bal);
            nativeBalance = bal;
          } else {
            const contract = new Contract(token.address, ERC20_ABI, provider);
            bal = await contract.balanceOf(normalizedAddress);
            bal = formatUnits(bal, token.decimals);
            erc20Balances.push({ symbol: token.symbol, balance: bal });
          }

          balances.push({
            symbol: token.symbol,
            balance: bal,
            address: token.address,
            chainId: provider.network?.chainId || null,
            isNative: token.isNative,
            decimals: token.decimals,
          });
        } catch (e) {
          console.warn(`Failed to fetch balance for token ${token.symbol}:`, e.message);
          // Continue with next token instead of failing completely
          balances.push({
            symbol: token.symbol,
            balance: '0',
            address: token.address,
            chainId: provider.network?.chainId || null,
            isNative: token.isNative,
            decimals: token.decimals,
          });
        }
      }

      if (chain === 'bsc') {
        console.log('BSC balance check', normalizedAddress, nativeBalance, erc20Balances);
      }
      console.log('Fetched balances', balances);
      return Response.json({ balances, chain });
    } catch (e) {
      console.warn('Balance fetch error:', e.message, e);
      return Response.json({ error: 'Failed to fetch balances', detail: e.message }, { status: 500 });
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return Response.json({ error: 'Internal server error', detail: e.message }, { status: 500 });
  }
} 