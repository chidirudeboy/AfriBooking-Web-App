import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogBySlug } from '@/lib/blog';

export const dynamic = 'force-dynamic';

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

function getDisplayAuthor() {
  return 'AfriBooking';
}

function renderParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = await getBlogBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post | AfriBooking',
    };
  }

  return {
    title: `${post.title} | AfriBooking`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const paragraphs = renderParagraphs(post.content);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <article className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-amber-200 hover:text-amber-100">
          ← Back to blog
        </Link>

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {post.isFeatured && (
              <span className="rounded-full bg-blue-400/15 px-3 py-1 font-medium text-blue-200">
                Featured
              </span>
            )}
            <span>{getDisplayAuthor()}</span>
            {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title} className="h-[260px] w-full object-cover sm:h-[420px]" />
          ) : (
            <div className="flex h-[260px] items-center justify-center bg-gradient-to-br from-amber-500/20 to-slate-900 text-2xl font-semibold text-amber-100 sm:h-[420px]">
              AfriBooking Blog
            </div>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-invert mt-10 max-w-none prose-p:text-slate-200 prose-p:leading-8 prose-headings:text-white">
          {paragraphs.map((paragraph, index) => (
            <p key={`${post.slug}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
