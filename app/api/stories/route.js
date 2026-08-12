import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: All active stories for everyone (Public View)
export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      where: { 
        expiresAt: { gt: new Date() } 
      },
      include: { 
        user: true 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
    });
    return NextResponse.json({ stories });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create Story (Text, Photo, Video)
export async function POST(req) {
  try {
    const { userId, mediaUrl, mediaType, textContent } = await req.json();

    if (!userId || userId === 'guest') {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Ensure User exists in Prisma
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

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 Hours Expiry

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || 'IMAGE', // 'IMAGE' | 'VIDEO' | 'TEXT'
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, story });
  } catch (error) {
    console.error('Story Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}