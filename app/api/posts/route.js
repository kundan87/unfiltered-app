import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tab = searchParams.get('tab');

    let whereClause = {};

    if (tab === 'reels') {
      whereClause = {
        OR: [{ type: 'VIDEO' }, { videoUrl: { not: null } }],
      };
    } else if (category && category.toLowerCase() !== 'all') {
      whereClause = {
        category: {
          equals: category,
          mode: 'insensitive',
        },
      };
    }

    // Try relational query first, fallback to basic query if user relation fails
    let posts = await prisma.video.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }).catch(async () => {
      return await prisma.video.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    });

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ posts: [] });
  }
}