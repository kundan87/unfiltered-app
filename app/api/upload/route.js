import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = body.clerkUserId || body.userId;
    const caption = body.caption || body.content || body.text || '';
    const category = body.category || 'General';

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 400 });
    }

    // 1. Safe User Sync
    let dbUser = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: { OR: [{ id: userId }, { email: `${userId}@unfiltered.app` }] },
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
    } catch (e) {
      console.warn('User lookup/creation fallback:', e.message);
    }

    const effectiveUserId = dbUser ? dbUser.id : userId;

    // 2. Create Post in DB
    const newPost = await prisma.video.create({
      data: {
        userId: effectiveUserId,
        caption: caption,
        category: category,
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
    console.error('Post Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish take' }, { status: 500 });
  }
}