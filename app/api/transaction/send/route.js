import { Wallet, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { getProvider, getTokenList } from '../../../../lib/chain';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export async function POST(request) {
  try {
    const { from, to, token, chain, amount, seedPhrase } = await request.json();

    if (!from || !to || !token || !chain || !amount || !seedPhrase) {
      return Response.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Get provider and token list for the chain
    const provider = getProvider(chain);
    const tokens = getTokenList(chain);

    // Find token details
    const tokenConfig = tokens.find(t => t.symbol.toLowerCase() === token.toLowerCase());
    if (!tokenConfig) {
      return Response.json({ 
        success: false, 
        error: `Token ${token} not found in ${chain} configuration` 
      }, { status: 400 });
    }

    // Create wallet instance
    const wallet = new Wallet(seedPhrase, provider);

    try {
      let tx;
      if (tokenConfig.isNative) {
        // Send native token (ETH, BNB, MATIC, etc)
        tx = await wallet.sendTransaction({
          to,
          value: parseUnits(amount, 18) // Native tokens always use 18 decimals
        });
      } else {
        // Send ERC-20 token
        if (!tokenConfig.address) {
          return Response.json({ 
            success: false, 
            error: `Token ${token} has no contract address` 
          }, { status: 400 });
        }

        const tokenContract = new Contract(tokenConfig.address, ERC20_ABI, wallet);
        
        // Get token decimals
        const decimals = tokenConfig.decimals || await tokenContract.decimals();
        
        // Check balance before sending
        const balance = await tokenContract.balanceOf(from);
        const amountInWei = parseUnits(amount, decimals);
        
        if (balance < amountInWei) {
          return Response.json({ 
            success: false, 
            error: `Insufficient ${token} balance` 
          }, { status: 400 });
        }

        // Send ERC-20 token
        tx = await tokenContract.transfer(to, amountInWei);
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return Response.json({
        success: true,
        txHash: receipt.hash,
        from,
        to,
        token,
        amount,
        chain
      });

    } catch (error) {
      console.error('Transaction error:', error);
      
      // Handle common errors
      if (error.message.includes('insufficient funds')) {
        return Response.json({ 
          success: false, 
          error: `Insufficient ${tokenConfig.isNative ? 'native token' : token} balance for transaction` 
        }, { status: 400 });
      }
      
      if (error.message.includes('gas required exceeds allowance')) {
        return Response.json({ 
          success: false, 
          error: 'Insufficient gas fee balance' 
        }, { status: 400 });
      }

      return Response.json({ 
        success: false, 
        error: error.message || 'Transaction failed' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 