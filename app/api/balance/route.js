import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CHAINS } from '@/lib/chain';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const chain = searchParams.get('chain');

    if (!address || !chain) {
      return NextResponse.json({ error: 'Missing address or chain' }, { status: 400 });
    }

    // Validate address
    if (!ethers.isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    // Get chain config
    const chainConfig = CHAINS[chain];
    if (!chainConfig) {
      return NextResponse.json({ error: 'Invalid chain' }, { status: 400 });
    }

    // Get provider
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl());

    // Get native token balance
    const nativeBalance = await provider.getBalance(address);
    
    // Get token balances
    const balances = {
      [chainConfig.native.symbol.toLowerCase()]: ethers.formatEther(nativeBalance)
    };

    // Get other token balances
    const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
    
    await Promise.all(
      chainConfig.tokens
        .filter(token => !token.isNative)
        .map(async (token) => {
          try {
            const contract = new ethers.Contract(token.address, tokenAbi, provider);
            const balance = await contract.balanceOf(address);
            balances[token.symbol.toLowerCase()] = ethers.formatUnits(balance, token.decimals);
          } catch (error) {
            console.error(`Failed to fetch balance for ${token.symbol}:`, error);
            balances[token.symbol.toLowerCase()] = '0';
          }
        })
    );

    return NextResponse.json({ balances });
  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
} 