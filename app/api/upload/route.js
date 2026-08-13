import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, category, caption, videoUrl, imageUrls, linkPreview, clerkUserId } = body;

    if (!clerkUserId || clerkUserId === 'guest') {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Auto sync user to Prisma DB if missing
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

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        caption: caption || '',
        category: category || 'General',
        type: type || 'TEXT',
        videoUrl: videoUrl || null,
        imageUrls: imageUrls ? (Array.isArray(imageUrls) ? imageUrls : [imageUrls]) : [],
        linkPreview: linkPreview ? JSON.stringify(linkPreview) : null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}