export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort'); // 'hot' for leaderboard

    let whereClause = {};
    if (category && category !== 'All') {
      whereClause.category = category;
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'hot') {
      orderBy = { agreeCount: 'desc' };
    }

    const videos = await prisma.video.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: orderBy,
    });

    return NextResponse.json({ videos });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to publish!' }, { status: 401 });
    }

    const { type, videoUrl, imageUrls, caption, linkPreview, category } = await request.json();

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { username: user.username || user.firstName || 'user' },
      create: {
        id: user.id,
        username: user.username || user.firstName || 'user',
        email: user.emailAddresses[0]?.emailAddress || `${user.id}@unfiltered.app`,
      },
    });

    const newPost = await prisma.video.create({
      data: {
        type: type || 'TEXT',
        category: category || 'General',
        videoUrl: videoUrl || null,
        imageUrls: imageUrls || null,
        linkUrl: linkPreview?.url || null,
        linkTitle: linkPreview?.title || null,
        linkDescription: linkPreview?.description || null,
        linkImage: linkPreview?.image || null,
        caption: caption || '',
        userId: dbUser.id,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, video: newPost });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}