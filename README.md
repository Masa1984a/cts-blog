# CTS Developer Blog

A multi-language blog system built with Next.js 15, featuring automatic translation to 7 languages powered by OpenAI GPT-5.

## Features

- 📝 **Markdown Editor** with live preview
- 🌐 **Multi-language Support** (Japanese, English, Spanish, Portuguese, Korean, Chinese Simplified, Chinese Traditional, Thai)
- 🤖 **Automatic Translation** using OpenAI GPT-5-nano
- 🖼️ **Image Upload** with Vercel Blob Storage
- 💾 **Auto-save** functionality (every 30 seconds)
- 🔒 **JWT Authentication** for admin panel
- 📱 **Responsive Design**
- 🚀 **Server-side Rendering** with Next.js App Router

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **@uiw/react-md-editor** (Markdown editor)
- **react-markdown** (Markdown rendering)

### Backend
- **Next.js API Routes**
- **Prisma** (ORM)
- **PostgreSQL** (Vercel Postgres)
- **OpenAI API** (GPT-5-nano for translations)

### Infrastructure
- **Vercel** (Hosting)
- **Vercel Blob Storage** (Image storage)
- **Vercel Postgres** (Database)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Vercel account (for Postgres and Blob Storage)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cts-blog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file with the following:
   ```env
   # Database (from Vercel Postgres dashboard)
   DATABASE_URL="postgresql://..."

   # OpenAI API (from https://platform.openai.com/api-keys)
   OPENAI_API_KEY="sk-proj-..."

   # Vercel Blob Storage (from Vercel dashboard)
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

   # JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
   JWT_SECRET="your-secret-here"

   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Copy to .env for Prisma**
   ```bash
   cp .env.local .env
   ```

5. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Blog: http://localhost:3000/blog
   - Admin: http://localhost:3000/admin

### First-time Setup

1. Go to http://localhost:3000/admin/login
2. Click "Need to create an account? Register"
3. Create your admin account
4. Start creating posts!

## Usage

### Creating a Post

1. Log in to the admin panel (`/admin/login`)
2. Click "New Post"
3. Upload a featured image (optional, max 5MB)
4. Write your content in Markdown
5. Click "Save Draft" to save
6. Click "Publish" to publish and translate

### Publishing Flow

When you click "Publish":
1. The post is automatically translated to 7 languages
2. Translation takes 1-3 minutes
3. The post becomes visible on the public blog
4. Visitors can switch languages using the language selector

### Supported Markdown

- Headings (`#`, `##`, `###`)
- Bold (`**text**`)
- Italic (`*text*`)
- Lists (`-`, `*`)
- Links (`[text](url)`)
- Code blocks (```)
- Blockquotes (`>`)
- Images

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Posts
- `GET /api/posts` - Get all posts (with filters)
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get single post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post (soft delete)
- `POST /api/posts/[id]/publish` - Publish and translate post

### Upload
- `POST /api/upload` - Upload image to Vercel Blob

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Set up Vercel Postgres**
   - In your Vercel project dashboard
   - Go to Storage → Create Database → Postgres
   - Copy the connection string

4. **Set up Vercel Blob Storage**
   - In your Vercel project dashboard
   - Go to Storage → Create Store → Blob
   - Copy the token

5. **Configure Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from `.env.local`

6. **Deploy**
   - Vercel will automatically deploy
   - Run database migration: `npx prisma db push`

## Project Structure

```
cts-blog/
├── app/
│   ├── admin/           # Admin panel
│   │   ├── login/       # Login page
│   │   └── posts/       # Post management
│   ├── api/             # API routes
│   │   ├── auth/        # Authentication
│   │   ├── posts/       # Post CRUD
│   │   └── upload/      # Image upload
│   ├── blog/            # Public blog
│   │   └── [id]/        # Post detail
│   └── layout.tsx       # Root layout
├── lib/
│   ├── auth.ts          # Authentication logic
│   ├── blob.ts          # Blob storage
│   ├── openai.ts        # OpenAI integration
│   └── prisma.ts        # Prisma client
├── prisma/
│   └── schema.prisma    # Database schema
├── types/
│   └── index.ts         # TypeScript types
└── middleware.ts        # Route protection
```

## Database Schema

### Posts Table
- `id` - UUID (Primary Key)
- `content_ja` - Japanese content (markdown)
- `content_en` - English content (translated)
- `content_es` - Spanish content (translated)
- `content_pt` - Portuguese content (translated)
- `content_ko` - Korean content (translated)
- `content_zh` - Simplified Chinese content (translated)
- `content_tw` - Traditional Chinese content (translated)
- `content_th` - Thai content (translated)
- `image_url` - Featured image URL
- `status` - DRAFT or PUBLISHED
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp
- `published_at` - Publication timestamp
- `deleted_at` - Soft delete timestamp

### Users Table
- `id` - UUID (Primary Key)
- `email` - User email (unique)
- `password_hash` - Hashed password
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

## Security

- JWT-based authentication
- HTTP-only cookies
- Password hashing with bcrypt
- CSRF protection
- Input validation with Zod
- Markdown sanitization
- File type and size validation

## Performance

- Server-side rendering
- Image optimization with Vercel
- CDN caching
- Database indexing
- Efficient Prisma queries

## Troubleshooting

### Database Connection Issues
- Make sure `DATABASE_URL` is correctly set in `.env`
- Run `npx prisma db push` to sync schema

### Translation Failures
- Check `OPENAI_API_KEY` is valid
- Ensure you have sufficient OpenAI credits
- Check API rate limits

### Image Upload Issues
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check file size (<5MB)
- Verify file type (JPEG, PNG, WebP only)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
