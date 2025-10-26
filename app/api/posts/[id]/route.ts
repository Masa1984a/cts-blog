import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';
import { translateToAllLanguages } from '@/lib/openai';

export const maxDuration = 300; // 5 minutes for translations

const updatePostSchema = z.object({
  content_ja: z.string().min(1).max(10000).optional(),
  image_url: z.string().url().optional().nullable(),
});

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'ja';
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: {
        id,
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

    return NextResponse.json({
      id: post.id,
      content,
      image_url: post.image_url,
      status: post.status,
      published_at: post.published_at?.toISOString() || null,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updatePostSchema.parse(body);

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id, deleted_at: null },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // If post is PUBLISHED and content_ja is being updated, re-translate
    let updateData = { ...data };
    if (existingPost.status === 'PUBLISHED' && data.content_ja) {
      console.log(`Re-translating published post ${id}`);
      const translations = await translateToAllLanguages(data.content_ja);

      updateData = {
        ...updateData,
        content_en: translations.en || null,
        content_es: translations.es || null,
        content_pt: translations.pt || null,
        content_ko: translations.ko || null,
        content_zh: translations.zh || null,
        content_tw: translations.tw || null,
        content_th: translations.th || null,
        published_at: new Date(), // Update published date
      };
    }

    // Update post
    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
        updated_at: post.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update post error:', error);

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

// DELETE /api/posts/[id] - Delete post (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Soft delete
    const post = await prisma.post.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
      deleted_at: post.deleted_at?.toISOString(),
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
