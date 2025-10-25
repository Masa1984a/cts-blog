import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { translateToAllLanguages, LANGUAGES, LanguageCode } from '@/lib/openai';

export const maxDuration = 300; // 5 minutes for translations

// POST /api/posts/[id]/publish - Publish post with translations
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: params.id, deleted_at: null },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Start translations
    console.log(`Starting translations for post ${params.id}`);
    const translations = await translateToAllLanguages(post.content_ja);

    // Update post with translations and publish
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        content_en: translations.en || null,
        content_es: translations.es || null,
        content_pt: translations.pt || null,
        content_ko: translations.ko || null,
        content_zh: translations.zh || null,
        content_tw: translations.tw || null,
        content_th: translations.th || null,
        status: 'PUBLISHED',
        published_at: new Date(),
      },
    });

    // Count successful translations
    const translationStatus: Record<string, boolean> = {};
    Object.keys(LANGUAGES).forEach((lang) => {
      translationStatus[lang] = !!translations[lang as LanguageCode];
    });

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        status: updatedPost.status,
        published_at: updatedPost.published_at?.toISOString(),
      },
      translations: translationStatus,
    });
  } catch (error) {
    console.error('Publish post error:', error);
    return NextResponse.json(
      { error: 'Failed to publish post', message: String(error) },
      { status: 500 }
    );
  }
}
