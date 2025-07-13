import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function GET(request, { params }) {
  try {
    const { userId } = params

    // Get wallet from database
    const result = await pool.query(`
      SELECT id, user_id, address, seed_phrase, 
             balance_eth, balance_usdt, balance_bnb, balance_pol, balance_base,
             created_at, updated_at
      FROM wallets 
      WHERE user_id = $1
    `, [userId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    const walletData = result.rows[0]

    // Format wallet data
    const wallet = {
      id: walletData.id.toString(),
      address: walletData.address,
      seedPhrase: walletData.seed_phrase,
      balance: {
        eth: walletData.balance_eth || '0.0',
        usdt: walletData.balance_usdt || '0.00',
        bnb: walletData.balance_bnb || '0.0',
        pol: walletData.balance_pol || '0.0',
        base: walletData.balance_base || '0.0'
      },
      createdAt: walletData.created_at,
      updatedAt: walletData.updated_at
    }

    return NextResponse.json(wallet)

  } catch (error) {
    console.error('Error getting wallet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 