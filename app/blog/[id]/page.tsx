'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github.css';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  published_at: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(searchParams.get('lang') || 'ja');

  const languages = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '简体中文' },
    { code: 'tw', name: '繁體中文' },
    { code: 'th', name: 'ไทย' },
  ];

  useEffect(() => {
    fetchPost();
  }, [resolvedParams.id, language]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}?lang=${language}`);
      const data = await response.json();

      if (response.ok) {
        setPost(data);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    router.push(`/blog/${resolvedParams.id}?lang=${newLang}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error || 'Post not found'}</p>
        <Link href="/blog" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to blog
          </Link>
          <div className="relative inline-block">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  🌐 {lang.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post image"
            className="w-full h-96 object-cover rounded-lg mb-6"
          />
        )}

        <time className="text-sm text-gray-500">
          {new Date(post.published_at).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          components={{
            h1: ({ ...props }) => <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
            h2: ({ ...props }) => <h2 className="text-3xl font-bold mt-6 mb-3 text-gray-900" {...props} />,
            h3: ({ ...props }) => <h3 className="text-2xl font-bold mt-4 mb-2 text-gray-900" {...props} />,
            p: ({ ...props }) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
            a: ({ ...props }) => (
              <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
            ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
            code: ({ className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <code className={`${className} block bg-gray-50 p-4 rounded-lg overflow-x-auto`} {...props}>
                  {children}
                </code>
              ) : (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props}>
                  {children}
                </code>
              );
            },
            blockquote: ({ ...props }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
