import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (!userId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    // Auto-sync or verify user in Neon DB
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
    console.error('Story Error:', error);
    return NextResponse.json({ error: error.message || 'Story upload failed' }, { status: 500 });
  }
}