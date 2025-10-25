'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const charCount = content.length;
  const maxChars = 10000;

  // Load post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${resolvedParams.id}`);
        const data = await response.json();

        if (response.ok) {
          setContent(data.content);
          setImageUrl(data.image_url || '');
          setStatus(data.status);
        } else {
          setError('Failed to load post');
        }
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [resolvedParams.id]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      handleSave(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [content, imageUrl, loading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImageUrl(data.url);
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (showNotification = true) => {
    setSaving(true);
    setError('');

    try {
      const payload = {
        content_ja: content,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const response = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setLastSaved(new Date());
        if (showNotification) {
          alert('Post updated successfully!');
        }
      } else {
        setError(data.error || 'Failed to update post');
      }
    } catch (err) {
      setError('Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this post? It will be translated to 7 languages.')) {
      return;
    }

    setPublishing(true);
    setError('');

    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}/publish`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Post published successfully!');
        router.push('/admin/posts');
      } else {
        setError(data.error || 'Failed to publish post');
      }
    } catch (err) {
      setError('Failed to publish post');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'PUBLISHED'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {status}
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Featured Image (Optional)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploading && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
        {imageUrl && (
          <div className="mt-4">
            <img src={imageUrl} alt="Preview" className="max-w-md rounded" />
          </div>
        )}
      </div>

      <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
        <div data-color-mode="light">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height={500}
            preview="live"
            hideToolbar={false}
          />
        </div>
      </div>

      <div className="mb-6 text-right">
        <span className={`text-sm ${charCount > maxChars ? 'text-red-600' : 'text-gray-500'}`}>
          {charCount} / {maxChars} characters
        </span>
      </div>

      {lastSaved && (
        <div className="mb-4 text-sm text-gray-500">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving || charCount > maxChars}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              disabled={publishing || charCount > maxChars}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {publishing && (
        <div className="mt-4 text-sm text-gray-500">
          <p>Translation in progress... This may take a few minutes.</p>
        </div>
      )}
    </div>
  );
}
