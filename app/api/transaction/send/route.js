import { Wallet, JsonRpcProvider, Contract, parseUnits, formatUnits, isAddress } from 'ethers';
import { getProvider, getTokenList, getChain } from '../../../../lib/chain';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export async function POST(request) {
  try {
    const { from, to, token, chain, amount, seedPhrase } = await request.json();

    // Validate required parameters
    if (!from || !to || !token || !chain || !amount || !seedPhrase) {
      return Response.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Validate addresses
    try {
      if (!isAddress(from) || !isAddress(to)) {
        return Response.json({
          success: false,
          error: 'Invalid address format'
        }, { status: 400 });
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Invalid address format'
      }, { status: 400 });
    }

    // Validate amount format
    try {
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return Response.json({
          success: false,
          error: 'Invalid amount'
        }, { status: 400 });
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Invalid amount format'
      }, { status: 400 });
    }

    // Get chain configuration and validate RPC URL
    let chainConfig;
    try {
      chainConfig = getChain(chain);
      if (!chainConfig.rpcUrl || chainConfig.rpcUrl.includes('undefined')) {
        throw new Error('Invalid RPC URL configuration');
      }
    } catch (error) {
      console.error('Chain configuration error:', error);
      return Response.json({
        success: false,
        error: 'Invalid chain configuration'
      }, { status: 400 });
    }

    // Get provider and token list
    let provider, tokens;
    try {
      provider = getProvider(chain);
      tokens = getTokenList(chain);
    } catch (error) {
      console.error('Provider/token list error:', error);
      return Response.json({
        success: false,
        error: 'Failed to initialize provider'
      }, { status: 500 });
    }

    // Find and validate token configuration
    const tokenConfig = tokens.find(t => t.symbol.toLowerCase() === token.toLowerCase());
    if (!tokenConfig) {
      return Response.json({ 
        success: false, 
        error: `Token ${token} not found in ${chain} configuration` 
      }, { status: 400 });
    }

    // Create wallet instance
    let wallet;
    try {
      wallet = new Wallet(seedPhrase, provider);
      // Verify wallet address matches sender
      if (wallet.address.toLowerCase() !== from.toLowerCase()) {
        return Response.json({
          success: false,
          error: 'Invalid wallet for sender address'
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Wallet creation error:', error);
      return Response.json({
        success: false,
        error: 'Invalid seed phrase or wallet configuration'
      }, { status: 400 });
    }

    try {
      let tx;
      if (tokenConfig.isNative) {
        // Parse amount for native token
        let valueInWei;
        try {
          valueInWei = parseUnits(amount, 18); // Native tokens always use 18 decimals
        } catch (error) {
          return Response.json({
            success: false,
            error: 'Invalid amount format for native token'
          }, { status: 400 });
        }

        // Check native balance
        const balance = await provider.getBalance(from);
        if (balance < valueInWei) {
          return Response.json({
            success: false,
            error: `Insufficient ${token} balance`
          }, { status: 400 });
        }

        // Send native token
        tx = await wallet.sendTransaction({
          to,
          value: valueInWei
        });
      } else {
        // Validate token contract
        if (!tokenConfig.address || !isAddress(tokenConfig.address)) {
          return Response.json({ 
            success: false, 
            error: `Invalid contract address for ${token}` 
          }, { status: 400 });
        }

        // Initialize contract
        let tokenContract;
        try {
          tokenContract = new Contract(tokenConfig.address, ERC20_ABI, wallet);
        } catch (error) {
          return Response.json({
            success: false,
            error: 'Failed to initialize token contract'
          }, { status: 500 });
        }
        
        // Get token decimals
        let decimals;
        try {
          decimals = tokenConfig.decimals || await tokenContract.decimals();
        } catch (error) {
          return Response.json({
            success: false,
            error: 'Failed to get token decimals'
          }, { status: 500 });
        }
        
        // Parse amount
        let amountInWei;
        try {
          amountInWei = parseUnits(amount, decimals);
        } catch (error) {
          return Response.json({
            success: false,
            error: 'Invalid amount format for token'
          }, { status: 400 });
        }
        
        // Check token balance
        try {
          const balance = await tokenContract.balanceOf(from);
          if (balance < amountInWei) {
            return Response.json({ 
              success: false, 
              error: `Insufficient ${token} balance` 
            }, { status: 400 });
          }
        } catch (error) {
          return Response.json({
            success: false,
            error: 'Failed to check token balance'
          }, { status: 500 });
        }

        // Send token
        tx = await tokenContract.transfer(to, amountInWei);
      }

      // Wait for transaction confirmation
      try {
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
        console.error('Transaction confirmation error:', error);
        return Response.json({
          success: false,
          error: 'Transaction failed to confirm'
        }, { status: 500 });
      }

    } catch (error) {
      console.error('Transaction error:', error);
      
      // Handle common errors
      if (error.message?.includes('insufficient funds')) {
        return Response.json({ 
          success: false, 
          error: `Insufficient ${tokenConfig.isNative ? 'native token' : token} balance for transaction` 
        }, { status: 400 });
      }
      
      if (error.message?.includes('gas required exceeds allowance')) {
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
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 