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
      return NextResponse.json({ error: 'User session required' }, { status: 401 });
    }

    // Auto-create user record if missing in DB
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        username: `user_${userId.slice(-6)}`,
        email: `${userId}@unfiltered.app`,
      },
    });

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
    console.error('Story upload error:', error);
    return NextResponse.json({ error: 'Failed to upload story' }, { status: 500 });
  }
}