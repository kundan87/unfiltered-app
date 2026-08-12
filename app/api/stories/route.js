import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ stories });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, mediaUrl, mediaType } = await req.json();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    const story = await prisma.story.create({
      data: {
        userId: userId || 'guest',
        mediaUrl,
        mediaType: mediaType || 'IMAGE',
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, story });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}