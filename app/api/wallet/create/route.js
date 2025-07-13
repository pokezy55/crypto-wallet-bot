import { NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function POST(request) {
  try {
    const { userId, address, seedPhrase } = await request.json()

    // Validate required fields
    if (!userId || !address || !seedPhrase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already has a wallet
    const existingWallet = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    )

    if (existingWallet.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already has a wallet' },
        { status: 409 }
      )
    }

    // Create new wallet document
    const result = await pool.query(`
      INSERT INTO wallets (user_id, address, seed_phrase, balance_eth, balance_usdt, balance_bnb, balance_pol, balance_base)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, address
    `, [
      userId,
      address,
      seedPhrase, // Store seed phrase in database for backup/restore
      '0.0', // balance_eth
      '0.00', // balance_usdt
      '0.0', // balance_bnb
      '0.0', // balance_pol
      '0.0' // balance_base
    ])

    // Return success response
    return NextResponse.json({
      success: true,
      id: result.rows[0].id.toString(),
      address: result.rows[0].address,
      message: 'Wallet created successfully'
    })

  } catch (error) {
    console.error('Error creating wallet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 