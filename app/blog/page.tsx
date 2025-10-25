'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('ja');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=published');
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Language Selector */}
      <div className="mb-8 flex justify-end">
        <div className="relative inline-block">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
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

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts published yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.id} className="border-b border-gray-200 pb-12 last:border-0">
              {post.image_url && (
                <Link href={`/blog/${post.id}?lang=${language}`}>
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-64 object-cover rounded-lg mb-6 hover:opacity-90 transition-opacity"
                  />
                </Link>
              )}
              <div className="space-y-3">
                <time className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="text-3xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  <Link href={`/blog/${post.id}?lang=${language}`}>{post.title}</Link>
                </h2>
                <Link
                  href={`/blog/${post.id}?lang=${language}`}
                  className="inline-block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
