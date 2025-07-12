import { NextResponse } from 'next/server';
import { createUser } from '@/lib/database';

export async function POST(req) {
  const data = await req.json();
  const user = await createUser(data);
  return NextResponse.json(user);
} 