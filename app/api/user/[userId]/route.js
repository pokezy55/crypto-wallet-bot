import { NextResponse } from 'next/server';
import { banUser } from '@/lib/database';
import { getUserById } from '@/lib/database';

export async function PATCH(req, { params }) {
  const { userId } = params;
  await banUser(userId);
  return NextResponse.json({ success: true });
}

export async function GET(req, { params }) {
  const { userId } = params;
  const user = await getUserById(userId);
  return NextResponse.json(user);
} 