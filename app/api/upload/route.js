import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, category, caption, videoUrl, imageUrls, linkPreview, clerkUserId } = body;

    if (!clerkUserId || clerkUserId === 'guest') {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Auto Sync User in DB
    const user = await prisma.user.upsert({
      where: { id: clerkUserId },
      update: {},
      create: {
        id: clerkUserId,
        username: `user_${clerkUserId.slice(-6)}`,
        email: `${clerkUserId}@unfiltered.app`,
      },
    });

    const post = await prisma.video.create({
      data: {
        userId: user.id,
        caption: caption || '',
        category: category || 'General',
        type: type || 'TEXT',
        videoUrl: videoUrl || null,
        imageUrls: imageUrls ? (Array.isArray(imageUrls) ? imageUrls.join(',') : imageUrls) : null,
        linkUrl: linkPreview?.url || null,
        linkTitle: linkPreview?.title || null,
        linkDescription: linkPreview?.description || linkPreview?.desc || null,
        linkImage: linkPreview?.image || null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Upload Post API Error:', error);
    return NextResponse.json({ error: error.message || 'Post creation failed' }, { status: 500 });
  }
}