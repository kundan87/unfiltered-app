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
    const formData = await req.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    const mediaUrl = "https://your-storage-url.com/" + file.name; // Replace with your file host URL
    const mediaType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expiration: 24 Hours

    const story = await prisma.story.create({
      data: { userId, mediaUrl, mediaType, expiresAt },
    });

    return NextResponse.json({ success: true, story });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}