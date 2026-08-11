import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

  try {
    const comments = await prisma.comment.findMany({
      where: { videoId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Please sign in to comment!' }, { status: 401 });

    const { videoId, text } = await request.json();
    if (!videoId || !text.trim()) {
      return NextResponse.json({ error: 'Video ID and text required' }, { status: 400 });
    }

    // Ensure user exists in DB
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { username: user.username || user.firstName || 'user' },
      create: {
        id: user.id,
        username: user.username || user.firstName || 'user',
        email: user.emailAddresses[0]?.emailAddress || '',
      },
    });

    const comment = await prisma.comment.create({
      data: {
        text,
        videoId,
        userId: dbUser.id,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}