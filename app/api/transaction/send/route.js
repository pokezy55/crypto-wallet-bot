import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ERC20 ABI minimal
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

// Mapping contract address per chain/token
const CONTRACTS = {
  eth: { USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  polygon: { USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', POL: '0x0000000000000000000000000000000000001010' },
  bsc: { USDT: '0x55d398326f99059fF775485246999027B3197955', USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' },
  base: { USDT: '0xAcd9e1c7A58dc6e6F47d6B00e0c9B6cfc6b54cd6', USDC: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4' }
};

// Mapping RPC URL per chain (isi sesuai environment Anda)
const RPC_URLS = {
  eth: process.env.ETH_RPC_URL,
  polygon: process.env.POLYGON_RPC_URL,
  bsc: process.env.BSC_RPC_URL,
  base: process.env.BASE_RPC_URL,
};

export async function POST(req) {
  try {
    const { from, to, token, chain, amount, seedPhrase } = await req.json();
    const rpcUrl = RPC_URLS[chain];
    if (!rpcUrl) return NextResponse.json({ success: false, error: 'Unsupported chain' }, { status: 400 });
    if (!seedPhrase) return NextResponse.json({ success: false, error: 'Missing seed phrase' }, { status: 400 });

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(seedPhrase).connect(provider);

    let tx;
    if (token === chain.toUpperCase()) {
      // Native transfer (ETH, BNB, MATIC, BASE)
      tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });
    } else {
      // ERC20 transfer
      const contractAddr = CONTRACTS[chain][token];
      if (!contractAddr) return NextResponse.json({ success: false, error: 'Token not supported' }, { status: 400 });
      const contract = new ethers.Contract(contractAddr, ERC20_ABI, wallet);
      const decimals = await contract.decimals();
      const value = ethers.parseUnits(amount, decimals);
      tx = await contract.transfer(to, value);
    }
    await tx.wait();
    return NextResponse.json({ success: true, txHash: tx.hash });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to send transaction' }, { status: 500 });
  }
} 