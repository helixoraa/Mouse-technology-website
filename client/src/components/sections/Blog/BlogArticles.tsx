import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl, usePosts } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Post } from '@/lib/types';
import { formatDate } from '@/lib/date';

export interface BlogArticlesContent {
  filters: string[];
  readLabel: string;
  emptyTitle: string;
  emptyText: string;
  /** Posts per page. The Figma frame shows 3 (1 featured + 2 cards). */
  pageSize?: number;
  prevLabel?: string;
  nextLabel?: string;
}

/** "Product explainers" filter matches posts whose category is "Product explainer" (singular), etc. */
const matches = (filter: string, category: string) => {
  const f = filter.toLowerCase();
  const c = category.toLowerCase();
  return f === 'all' || f === c || f.startsWith(c) || c.startsWith(f.replace(/s$/, ''));
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
    <Link
      to={`/blog#${slug}`}
      className="inline-flex min-h-11 items-center gap-2 self-start text-[14.5px] font-semibold leading-5 text-brand hover:underline xl:min-h-0"
    >
      {label}
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
      className="grid overflow-hidden rounded-xl3 border border-line bg-white shadow-card lg:grid-cols-[minmax(0,600fr)_minmax(0,696fr)]"
    >
      <img
        src={mediaUrl(post.image)}
        alt={post.title}
        className="h-64 w-full object-cover object-center md:h-80 lg:h-full lg:min-h-[340px] xl:h-[420px]"
      />
      <div className="flex flex-col justify-center gap-5 p-6 md:p-10 xl:px-14 xl:py-12">
        <div className="flex items-center gap-3.5">
          <CategoryChip>{post.category}</CategoryChip>
          <time dateTime={post.publishedAt} className="text-[13px] text-ink-500">
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h2 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink md:text-[36px] md:leading-10">{post.title}</h2>
        <p className="text-[17px] leading-7 text-ink-700">{post.excerpt}</p>
        <ReadLink slug={post.slug} label={readLabel} />
      </div>
    </article>
  );
}

function Card({ post, readLabel }: { post: Post; readLabel: string }) {
  return (
    <article id={post.slug} className="flex flex-col gap-5 rounded-xl2 border border-line bg-white px-5 pb-7 pt-5 shadow-card">
      <img src={mediaUrl(post.image)} alt={post.title} className="h-[200px] w-full rounded-[18px] object-cover object-center" />
      <div className="flex flex-col gap-3 px-3">
        <div className="flex items-center gap-3">
          <CategoryChip>{post.category}</CategoryChip>
          <time dateTime={post.publishedAt} className="text-[12.5px] text-ink-700">
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h3 className="text-2xl font-bold leading-8 tracking-[-0.01em] text-ink">{post.title}</h3>
        <p className="text-[15px] leading-6 text-ink-500">{post.excerpt}</p>
        <ReadLink slug={post.slug} label={readLabel} />
      </div>
    </article>
  );
}

function Pager({
  page,
  pages,
  onChange,
  prev,
  next,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
  prev: string;
  next: string;
}) {
  const btn = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border px-4 text-sm font-semibold transition-colors';
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={cn(btn, 'border-line bg-surface-tint text-ink-700 hover:bg-white disabled:opacity-50')}
      >
        <span aria-hidden>←</span>&nbsp;{prev}
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Page ${n}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
          className={cn(btn, n === page ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:bg-surface-tint')}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className={cn(btn, 'border-line bg-surface-tint text-ink-700 hover:bg-white disabled:opacity-50')}
      >
        {next}&nbsp;<span aria-hidden>→</span>
      </button>
    </nav>
  );
}

/** Filter chips, featured article, article cards and pager. Posts come from the Post API; labels from the page section. */
export function BlogArticles({ content }: { content?: BlogArticlesContent }) {
  const { data: posts = [] } = usePosts();
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter]);
  if (!content) return null;
  const size = content.pageSize ?? 3;
  const list = posts.filter((p) => matches(filter, p.category));
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  const slice = list.slice((current - 1) * size, current * size);
  const [featured, ...rest] = slice;
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
                'min-h-11 rounded-pill border px-[22px] py-3 text-[14.5px] font-semibold leading-5 transition-colors',
                filter === f ? 'border-line bg-white text-ink' : 'border-line bg-surface-tint text-ink-700 hover:bg-white',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {featured && <Featured post={featured} readLabel={content.readLabel} />}
        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Card key={p.id} post={p} readLabel={content.readLabel} />
          ))}
          {current === 1 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 border border-line bg-white p-8 shadow-card">
              <h3 className="text-[22px] font-bold text-ink">{content.emptyTitle}</h3>
              <p className="self-stretch text-[15px] leading-6 text-ink-500">{content.emptyText}</p>
            </div>
          )}
        </div>
        {pages > 1 && (
          <Pager page={current} pages={pages} onChange={setPage} prev={content.prevLabel ?? 'Prev'} next={content.nextLabel ?? 'Next'} />
        )}
        {list.length === 0 && <p className="text-center text-ink-500">No articles in this category yet.</p>}
      </div>
    </section>
  );
}

export default BlogArticles;
