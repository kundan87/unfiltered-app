// app/api/live/start/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { userId } = await req.json();

    // 1. Mark User as LIVE
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isLive: true },
      include: { followers: true },
    });

    // 2. Fetch all followers
    const followers = await prisma.follows.findMany({
      where: { followingId: userId },
    });

    // 3. Send Notification to each follower
    const notificationsData = followers.map((f) => ({
      userId: f.followerId,
      type: 'LIVE_START',
      message: `@${user.username || user.name} is now LIVE! Join the stream 🔥`,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({ success: true, liveStreamUrl: `/live/${userId}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}