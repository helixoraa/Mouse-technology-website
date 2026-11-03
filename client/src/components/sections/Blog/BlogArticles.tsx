import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl, usePosts } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Post } from '@/lib/types';

export interface BlogArticlesContent {
  filters: string[];
  readLabel: string;
  emptyTitle: string;
  emptyText: string;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' });

const matches = (filter: string, category: string) => {
  const f = filter.toLowerCase();
  return f === 'all' || f === category.toLowerCase() || f.startsWith(category.toLowerCase());
};

function CategoryChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-pill border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
      {children}
    </span>
  );
}

function ReadLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link to={`/blog#${slug}`} className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-brand hover:underline">
      {label}{' '}
      <span aria-hidden className="text-[15px]">
        →
      </span>
    </Link>
  );
}

function Featured({ post, readLabel }: { post: Post; readLabel: string }) {
  return (
    <article
      id={post.slug}
      className="grid overflow-hidden rounded-xl3 border border-line bg-white shadow-card lg:grid-cols-[minmax(0,602px)_1fr]"
    >
      <img src={mediaUrl(post.image)} alt={post.title} className="h-64 w-full object-cover lg:h-full lg:min-h-[421px]" />
      <div className="flex flex-col justify-center gap-5 p-6 md:p-10 lg:p-14">
        <div className="flex items-center gap-3">
          <CategoryChip>{post.category}</CategoryChip>
          <time dateTime={post.publishedAt} className="text-xs text-ink-500">
            {fmt(post.publishedAt)}
          </time>
        </div>
        <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-ink md:text-h-card-lg">{post.title}</h2>
        <p className="text-body text-ink-500">{post.excerpt}</p>
        <ReadLink slug={post.slug} label={readLabel} />
      </div>
    </article>
  );
}

function Card({ post, readLabel }: { post: Post; readLabel: string }) {
  return (
    <article id={post.slug} className="flex flex-col gap-5 rounded-xl2 border border-line bg-white p-5 shadow-card">
      <img src={mediaUrl(post.image)} alt={post.title} className="h-[199px] w-full rounded-[20px] object-cover" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CategoryChip>{post.category}</CategoryChip>
          <time dateTime={post.publishedAt} className="text-xs text-ink-500">
            {fmt(post.publishedAt)}
          </time>
        </div>
        <h3 className="text-h-card font-extrabold text-ink">{post.title}</h3>
        <p className="text-body-sm text-ink-500">{post.excerpt}</p>
        <ReadLink slug={post.slug} label={readLabel} />
      </div>
    </article>
  );
}

/** Filter chips, featured article and article grid. Posts come from the Post API; labels from the page section. */
export function BlogArticles({ content }: { content?: BlogArticlesContent }) {
  const { data: posts = [] } = usePosts();
  const [filter, setFilter] = useState('All');
  if (!content) return null;
  const list = posts.filter((p) => matches(filter, p.category));
  const [featured, ...rest] = list;
  return (
    <section className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]" aria-label="Articles">
      <div className="mx-auto flex max-w-page flex-col gap-14">
        <div role="group" aria-label="Filter articles" className="flex flex-wrap gap-3">
          {content.filters.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-pill border px-6 py-3 text-sm font-medium transition-colors',
                filter === f ? 'border-line bg-white text-ink' : 'border-line bg-surface-tint text-ink-700 hover:bg-white',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {featured && <Featured post={featured} readLabel={content.readLabel} />}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Card key={p.id} post={p} readLabel={content.readLabel} />
          ))}
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl2 border border-line bg-white p-8 shadow-card">
            <h3 className="text-xl font-bold text-ink">{content.emptyTitle}</h3>
            <p className="max-w-[260px] text-body-sm text-ink-500">{content.emptyText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BlogArticles;
