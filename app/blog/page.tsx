import Link from 'next/link';
import { getPublishedBlogs } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog | AfriBooking',
  description: 'Travel stories, booking tips, property updates, and hosting insights from AfriBooking.',
};

function stripHtml(content: string) {
  return content.replace(/<[^>]+>/g, '');
}

function getDisplayAuthor() {
  return 'AfriBooking';
}

export default async function BlogPage() {
  const posts = await getPublishedBlogs();
  const [featuredPost, ...otherPosts] = posts;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.25),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-sm font-medium text-amber-200">
            AfriBooking Journal
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Travel notes, booking guidance, and property stories from the team.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Read practical tips for guests, updates from our marketplace, and curated stories from apartments and destinations we care about.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {featuredPost ? (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group mb-12 grid overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 transition hover:border-amber-300/40 hover:bg-white/[0.07] lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="relative min-h-[280px] bg-slate-900">
              {featuredPost.coverImage ? (
                <img
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent text-amber-100">
                  <span className="text-xl font-semibold">Featured Story</span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between p-8">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 font-medium text-emerald-200">
                    Featured
                  </span>
                  {featuredPost.publishedAt && (
                    <span>{new Date(featuredPost.publishedAt).toLocaleDateString()}</span>
                  )}
                  <span>{getDisplayAuthor()}</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  {featuredPost.title}
                </h2>
                <p className="mt-4 line-clamp-4 text-base leading-7 text-slate-300">
                  {featuredPost.excerpt || stripHtml(featuredPost.content).slice(0, 220)}
                </p>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                Read article
                <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center text-slate-300">
            No blog posts have been published yet.
          </div>
        )}

        {otherPosts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {otherPosts.map((post) => (
              <Link
                key={post.id || post._id || post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-amber-300/30 hover:bg-white/[0.06]"
              >
                <div className="h-48 bg-slate-900">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-400">
                      AfriBooking
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(post.tags || []).slice(0, 2).map((tag) => (
                      <span key={`${post.slug}-${tag}`} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                    {post.excerpt || stripHtml(post.content).slice(0, 150)}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}</span>
                    <span className="font-medium text-amber-200">{getDisplayAuthor()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
