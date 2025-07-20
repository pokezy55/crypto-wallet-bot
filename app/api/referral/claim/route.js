import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  // Redirect to the new submit endpoint
  const url = new URL(req.url)
  url.pathname = '/api/referral/submit'
  
  return NextResponse.redirect(url.toString(), 308)
} 