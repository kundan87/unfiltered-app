import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let stories = await prisma.story.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }).catch(async () => {
      // Fallback if relation query fails
      return await prisma.story.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });

    return NextResponse.json({ stories: stories || [] });
  } catch (error) {
    return NextResponse.json({ stories: [] });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, mediaUrl, mediaType } = body;

    if (!userId || !mediaUrl) {
      return NextResponse.json({ error: 'User ID and Media content required' }, { status: 400 });
    }

    // 1. Safe User Check / Creation in Neon DB
    let dbUser = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ id: userId }, { email: `${userId}@unfiltered.app` }],
        },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            username: `user_${userId.slice(-6)}`,
            email: `${userId}@unfiltered.app`,
          },
        });
      }
    } catch (userErr) {
      console.warn('User sync warning:', userErr.message);
    }

    const effectiveUserId = dbUser ? dbUser.id : userId;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 2. Safe Story Creation
    let story;
    try {
      story = await prisma.story.create({
        data: {
          userId: effectiveUserId,
          mediaUrl: mediaUrl,
          mediaType: mediaType || 'IMAGE',
          expiresAt: expiresAt,
        },
      });
    } catch (sErr) {
      // Fallback without optional fields
      story = await prisma.story.create({
        data: {
          userId: effectiveUserId,
          mediaUrl: mediaUrl,
        },
      });
    }

    return NextResponse.json({ success: true, story });
  } catch (error) {
    console.error('Story Save Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save story to DB' },
      { status: 500 }
    );
  }
}