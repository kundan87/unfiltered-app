import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        videos: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Calculate Credibility Score
    let totalAgrees = 0;
    let totalCaps = 0;

    user.videos.forEach((v) => {
      totalAgrees += v.agreeCount;
      totalCaps += v.capCount;
    });

    const totalVotes = totalAgrees + totalCaps;
    const agreeRatio = totalVotes > 0 ? Math.round((totalAgrees / totalVotes) * 100) : 100;

    let badge = '🔥 Rising Star';
    if (totalAgrees > 50 && agreeRatio > 70) badge = '👑 Hot Take God';
    else if (agreeRatio < 40) badge = '🧢 Cap Master';

    return NextResponse.json({
      user,
      stats: {
        totalPosts: user.videos.length,
        totalAgrees,
        totalCaps,
        agreeRatio,
        badge,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}