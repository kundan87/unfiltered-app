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
    console.error('GET Stories Error:', error);
    return NextResponse.json({ stories: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, mediaUrl, mediaType } = body;

    if (!userId || userId === 'guest') {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Media URL or image is required' }, { status: 400 });
    }

    // Auto-create or fetch user in Neon DB to avoid foreign key crash
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        username: `user_${userId.slice(-6)}`,
        email: `${userId}@unfiltered.app`,
      },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours validity

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
    console.error('Story Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'Error uploading story' }, { status: 500 });
  }
}