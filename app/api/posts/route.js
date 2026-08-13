import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const posts = await prisma.video.findMany({
      include: {
        user: true,
        comments: true,
        votes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('GET Posts Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}