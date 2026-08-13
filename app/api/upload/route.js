import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, category, caption, videoUrl, imageUrls, linkPreview, clerkUserId } = body;

    if (!clerkUserId || clerkUserId === 'guest') {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Safe Prisma Model Access
    const dbUser = prisma.user || prisma.User;
    const dbPost = prisma.post || prisma.Post;

    if (!dbUser || !dbPost) {
      return NextResponse.json({ error: 'Database model initialization failed' }, { status: 500 });
    }

    // Auto-sync or find user safely
    let user = await dbUser.findUnique({ where: { id: clerkUserId } });
    if (!user) {
      user = await dbUser.create({
        data: {
          id: clerkUserId,
          username: `user_${clerkUserId.slice(-6)}`,
          email: `${clerkUserId}@unfiltered.app`,
        },
      });
    }

    const post = await dbPost.create({
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
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}