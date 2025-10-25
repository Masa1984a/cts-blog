import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiToken, unauthorizedApiResponse } from '@/lib/api-auth';

// GET /api/public/posts/[id] - Get single published post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify API token
    if (!verifyApiToken(request)) {
      return unauthorizedApiResponse();
    }

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ja';
    const { id } = await params;

    // Validate language
    const validLanguages = ['ja', 'en', 'es', 'pt', 'ko', 'zh', 'tw', 'th'];
    if (!validLanguages.includes(lang)) {
      return NextResponse.json(
        { error: `Invalid language. Supported languages: ${validLanguages.join(', ')}` },
        { status: 400 }
      );
    }

    // Get published post only
    const post = await prisma.post.findUnique({
      where: {
        id,
        status: 'PUBLISHED',
        deleted_at: null,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get content based on language
    const contentMap: Record<string, string | null> = {
      ja: post.content_ja,
      en: post.content_en,
      es: post.content_es,
      pt: post.content_pt,
      ko: post.content_ko,
      zh: post.content_zh,
      tw: post.content_tw,
      th: post.content_th,
    };

    const content = contentMap[lang] || post.content_ja;

    if (!content) {
      return NextResponse.json(
        {
          error: 'Content not available in requested language',
          available_languages: Object.keys(contentMap).filter(k => contentMap[k])
        },
        { status: 404 }
      );
    }

    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';

    return NextResponse.json({
      id: post.id,
      title,
      content_md: content,
      image_url: post.image_url,
      language: lang,
      published_at: post.published_at?.toISOString() || post.created_at.toISOString(),
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Public API: Get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
