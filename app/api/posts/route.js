import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbPost = prisma.post || prisma.Post;
    if (!dbPost) return NextResponse.json({ posts: [] });

    const posts = await dbPost.findMany({
      include: {
        user: true,
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