import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const createPostSchema = z.object({
  content_ja: z.string().min(1).max(10000),
  image_url: z.string().url().optional(),
});

// GET /api/posts - Get all posts (with filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // draft or published
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    // Get posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          content_ja: true,
          image_url: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Extract title from first heading in markdown
    const postsWithTitle = posts.map((post) => {
      const titleMatch = post.content_ja.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Untitled';

      return {
        id: post.id,
        title,
        image_url: post.image_url,
        status: post.status,
        created_at: post.created_at.toISOString(),
        updated_at: post.updated_at.toISOString(),
      };
    });

    return NextResponse.json({
      posts: postsWithTitle,
      total,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create new post (draft)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content_ja, image_url } = createPostSchema.parse(body);

    // Create post
    const post = await prisma.post.create({
      data: {
        content_ja,
        image_url,
        status: 'DRAFT',
      },
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
        created_at: post.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create post error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
