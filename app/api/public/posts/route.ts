import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiToken, unauthorizedApiResponse } from '@/lib/api-auth';

// GET /api/public/posts - Get published posts list
export async function GET(request: NextRequest) {
  try {
    // Verify API token
    if (!verifyApiToken(request)) {
      return unauthorizedApiResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const lang = searchParams.get('lang') || 'ja';

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Get published posts only
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deleted_at: null,
        },
        orderBy: {
          published_at: 'desc',
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          content_ja: true,
          image_url: true,
          published_at: true,
          created_at: true,
        },
      }),
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          deleted_at: null,
        },
      }),
    ]);

    // Extract title from first heading in markdown
    const postsWithTitle = posts.map((post) => {
      const titleMatch = post.content_ja.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Untitled';

      // Extract excerpt (first 200 characters of non-heading content)
      const contentWithoutTitle = post.content_ja.replace(/^#\s+.+$/m, '').trim();
      const excerpt = contentWithoutTitle.substring(0, 200) + (contentWithoutTitle.length > 200 ? '...' : '');

      return {
        id: post.id,
        title,
        excerpt,
        image_url: post.image_url,
        published_at: post.published_at?.toISOString() || post.created_at.toISOString(),
      };
    });

    return NextResponse.json({
      posts: postsWithTitle,
      meta: {
        total,
        limit,
        offset,
        count: postsWithTitle.length,
      },
      filters: {
        lang,
      },
    });
  } catch (error) {
    console.error('Public API: Get posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
