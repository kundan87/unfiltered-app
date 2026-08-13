import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { clerkUserId, caption, category, type, linkPreview, videoUrl, imageUrls } = body;

    if (!clerkUserId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    // 1. Auto-Sync User in Database if not exists
    let user = await prisma.user.findUnique({ where: { id: clerkUserId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: clerkUserId,
          username: `user_${clerkUserId.slice(-6)}`,
          email: `${clerkUserId}@unfiltered.app`,
        },
      });
    }

    // 2. Create Post Record
    const newPost = await prisma.video.create({
      data: {
        userId: user.id,
        caption: caption || '',
        category: category || 'General',
        type: type || (videoUrl ? 'VIDEO' : linkPreview ? 'LINK' : 'TEXT'),
        videoUrl: videoUrl || null,
        imageUrls: imageUrls || null,
        linkUrl: linkPreview?.url || null,
        linkTitle: linkPreview?.title || null,
        linkDescription: linkPreview?.description || null,
        linkImage: linkPreview?.image || null,
      },
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save post' }, { status: 500 });
  }
}