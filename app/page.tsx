import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CTS Developer Blog</h1>
        <p className="text-xl text-gray-600">
          Technical articles and insights
        </p>
        <div className="mt-8 space-x-4">
          <Link
            href="/blog"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Blog
          </Link>
          <Link
            href="/admin"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  )
}