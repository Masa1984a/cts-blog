import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CTS Developer Blog',
  description: 'Technical articles and insights from CTS development team',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}