import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tab = searchParams.get('tab'); // 'hot-takes' or 'reels'

    let whereClause = {};

    if (tab === 'reels') {
      whereClause = {
        OR: [{ type: 'VIDEO' }, { videoUrl: { not: null } }],
      };
    } else {
      if (category && category !== 'All') {
        whereClause.category = category;
      }
    }

    const posts = await prisma.video.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    return NextResponse.json({ posts: [] });
  }
}