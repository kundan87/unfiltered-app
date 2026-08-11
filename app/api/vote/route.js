export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, type } = await request.json();

    const post = await prisma.video.findUnique({ where: { id: videoId } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Update vote counts
    const updatedPost = await prisma.video.update({
      where: { id: videoId },
      data: {
        agreeCount: type === 'HOT' ? { increment: 1 } : undefined,
        capCount: type === 'CAP' ? { increment: 1 } : undefined,
      },
    });

    // Create Notification if voter is not the owner
    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          actorName: user.username || user.firstName || 'Someone',
          type: type === 'HOT' ? 'VOTE_HOT' : 'VOTE_CAP',
          videoId: videoId,
        },
      });
    }

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}