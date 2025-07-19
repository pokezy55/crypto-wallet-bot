import { NextResponse } from 'next/server';
import { getProvider, getChainConfig } from '@/lib/chain';
import { JsonRpcProvider, Contract, parseUnits } from 'ethers';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export async function POST(request) {
  try {
    const { from, to, amount, token, chain } = await request.json();

    // Validate required fields
    if (!from || !to || !amount || !token || !chain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get chain config
    const chainConfig = getChainConfig(chain);
    if (!chainConfig) {
      return NextResponse.json(
        { error: 'Invalid chain' },
        { status: 400 }
      );
    }

    // Get provider
    const provider = getProvider(chain);

    // Send transaction
    let tx;
    if (token.isNative) {
      // Send native token
      try {
        // Parse amount to wei
        const valueInWei = parseUnits(amount, 18);

        // Check balance
        const balance = await provider.getBalance(from);
        if (balance < valueInWei) {
          return NextResponse.json(
            { error: `Insufficient ${token.symbol} balance` },
            { status: 400 }
          );
        }

        // Send transaction
        tx = await provider.sendTransaction({
          from,
          to,
          value: valueInWei
        });
      } catch (error) {
        console.error('Native token transfer error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to send native token' },
          { status: 500 }
        );
      }
    } else {
      // Send ERC-20 token
      try {
        if (!token.address) {
          return NextResponse.json(
            { error: 'Token address is required' },
            { status: 400 }
          );
        }

        // Get token contract
        const tokenContract = new Contract(token.address, ERC20_ABI, provider);

        // Parse amount to wei
        const amountInWei = parseUnits(amount, token.decimals);

        // Check balance
        const balance = await tokenContract.balanceOf(from);
        if (balance < amountInWei) {
          return NextResponse.json(
            { error: `Insufficient ${token.symbol} balance` },
            { status: 400 }
          );
        }

        // Send transaction
        tx = await tokenContract.transfer(to, amountInWei);
      } catch (error) {
        console.error('ERC20 token transfer error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to send token' },
          { status: 500 }
        );
      }
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.hash
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Transaction failed' },
      { status: 500 }
    );
  }
} 