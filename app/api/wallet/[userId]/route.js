import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'
import { fetchEthBalance, fetchErc20Balance } from '@/lib/crypto-alchemy'
import { JsonRpcProvider, Contract } from 'ethers'

const CHAINS = ['eth', 'polygon', 'bsc', 'base']
const NATIVE_SYMBOL = { eth: 'eth', polygon: 'pol', bsc: 'bnb', base: 'base' }
const ERC20_TOKENS = ['USDT']
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)'
]
const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://rpc.ankr.com/bsc';
const BSC_ERC20 = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
}

export async function GET(request, { params }) {
  try {
    const { userId } = params
    const walletData = await getWalletByUserId(userId)
    if (!walletData) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }
    const address = walletData.address
    // Fetch balance dari semua chain utama
    const balances = {}
    for (const chain of CHAINS) {
      balances[chain] = {}
      const nativeSymbol = NATIVE_SYMBOL[chain]
      if (chain === 'bsc') {
        // Native BNB
        const provider = new JsonRpcProvider(BSC_RPC_URL)
        const bal = await provider.getBalance(address)
        balances[chain][nativeSymbol] = (Number(bal) / 1e18).toString()
        // ERC20 USDT
        for (const symbol of ERC20_TOKENS) {
          const contract = new Contract(BSC_ERC20[symbol], ERC20_ABI, provider)
          const balErc20 = await contract.balanceOf(address)
          balances[chain][symbol.toLowerCase()] = (Number(balErc20) / 1e18).toString()
        }
      } else {
        // Chain lain tetap pakai helper lama
        balances[chain][nativeSymbol] = (await fetchEthBalance(address, chain)).toString()
        for (const symbol of ERC20_TOKENS) {
          balances[chain][symbol.toLowerCase()] = (await fetchErc20Balance(address, symbol, chain)).toString()
        }
      }
    }
    // Format wallet data
    const wallet = {
      id: walletData.id?.toString(),
      address: walletData.address,
      seedPhrase: walletData.seed_phrase,
      balance: balances,
      createdAt: walletData.created_at,
      updatedAt: walletData.updated_at
    }
    return NextResponse.json(wallet)
  } catch (error) {
    console.error('Error getting wallet:', error)
    // Tambahkan detail error ke response untuk debug
    return NextResponse.json(
      { error: 'Internal server error', detail: error?.message || String(error) },
      { status: 500 }
    )
  }
} 