import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { userId, username } = await req.json();

    // Clean username format (lowercase, no spaces)
    const formattedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

    // Check availability
    const existingUser = await prisma.user.findUnique({
      where: { username: formattedUsername },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json({ error: 'Username already taken!' }, { status: 400 });
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: formattedUsername },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}