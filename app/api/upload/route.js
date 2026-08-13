import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = body.clerkUserId || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

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

    const newPost = await prisma.video.create({
      data: {
        userId: user.id,
        caption: body.caption || body.content || '',
        category: body.category || 'General',
        type: body.type || (body.videoUrl ? 'VIDEO' : body.linkPreview ? 'LINK' : 'TEXT'),
        videoUrl: body.videoUrl || null,
        imageUrls: body.imageUrls || body.image || null,
        linkUrl: body.linkPreview?.url || body.linkUrl || null,
        linkTitle: body.linkPreview?.title || body.linkTitle || null,
        linkDescription: body.linkPreview?.description || body.linkDescription || null,
        linkImage: body.linkPreview?.image || body.linkImage || null,
      },
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save post' }, { status: 500 });
  }
}