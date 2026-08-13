import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json({ stories });
  } catch (error) {
    return NextResponse.json({ stories: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, mediaUrl, mediaType } = body;

    if (!userId || !mediaUrl) {
      return NextResponse.json({ error: 'User ID and Media required' }, { status: 400 });
    }

    // Ensure User exists in Neon DB
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          username: `user_${userId.slice(-6)}`,
          email: `${userId}@unfiltered.app`,
        },
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: mediaUrl,
        mediaType: mediaType || 'IMAGE',
        expiresAt: expiresAt,
      },
    });

    return NextResponse.json({ success: true, story });
  } catch (error) {
    console.error('Story Upload DB Error:', error);
    return NextResponse.json({ error: 'Database rejected story payload' }, { status: 500 });
  }
}