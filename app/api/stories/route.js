import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbStory = prisma.story || prisma.Story;
    if (!dbStory) return NextResponse.json({ stories: [] });

    const stories = await dbStory.findMany({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, mediaUrl, mediaType } = await req.json();

    if (!userId || userId === 'guest') {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    const dbUser = prisma.user || prisma.User;
    const dbStory = prisma.story || prisma.Story;

    if (!dbUser || !dbStory) {
      return NextResponse.json({ error: 'Database model initialization failed' }, { status: 500 });
    }

    let user = await dbUser.findUnique({ where: { id: userId } });
    if (!user) {
      user = await dbUser.create({
        data: {
          id: userId,
          username: `user_${userId.slice(-6)}`,
          email: `${userId}@unfiltered.app`,
        },
      });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await dbStory.create({
      data: {
        userId: user.id,
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || 'IMAGE',
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, story });
  } catch (error) {
    console.error('Story API Error:', error);
    return NextResponse.json({ error: error.message || 'Story upload failed' }, { status: 500 });
  }
}