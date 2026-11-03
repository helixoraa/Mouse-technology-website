import { Link } from 'react-router-dom';
import { mediaUrl, usePosts } from '@/lib/api';
import { Segments } from '@/components/ui/Heading';
import blogDot from '@/assets/svg/home-blog-dot.svg';
import blogEllipseA from '@/assets/svg/home-blog-ellipse-a.svg';
import blogEllipseB from '@/assets/svg/home-blog-ellipse-b.svg';
import arrowBlue from '@/assets/svg/home-arrow-blue-sm.svg';
import type { Post } from '@/lib/types';
import type { BlogContent } from './types';

function CategoryChip({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-pill border border-brand/[0.45] bg-brand/10 px-3.5 py-[7px] text-xs font-semibold text-brand">
      <img src={blogDot} alt="" className="size-[7px]" />
      {label}
    </span>
  );
}

function Featured({ post }: { post: Post }) {
  return (
    <article className="flex flex-1 flex-col overflow-hidden rounded-xl2 border border-line bg-white">
      <div className="relative h-[250px] w-full overflow-hidden bg-blog-art">
        {post.image && <img src={mediaUrl(post.image)} alt="" className="absolute inset-0 size-full object-cover" />}
        <div aria-hidden className="absolute left-[416px] top-[-80px] hidden size-[300px] lg:block">
          <div className="absolute inset-[-30%]">
            <img src={blogEllipseA} alt="" className="size-full max-w-none" />
          </div>
        </div>
        <div aria-hidden className="absolute left-[-60px] top-[130px] size-[220px]">
          <div className="absolute inset-[-36.36%]">
            <img src={blogEllipseB} alt="" className="size-full max-w-none" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 p-6 sm:p-[30px]">
        <CategoryChip label={post.category} />
        <h3 className="max-w-[570px] text-2xl font-medium leading-8 tracking-[-0.012em] text-ink xl:text-[26px]">{post.title}</h3>
        <p className="max-w-[570px] text-[14.5px] leading-[22px] text-ink-500">{post.excerpt}</p>
        <p className="text-[13px] font-semibold text-ink-500">{post.author}</p>
      </div>
    </article>
  );
}

function Compact({ post }: { post: Post }) {
  return (
    <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl2 border border-line bg-white sm:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-blog-thumb sm:h-auto sm:w-[190px]">
        {post.image && <img src={mediaUrl(post.image)} alt="" className="absolute inset-0 size-full object-cover" />}
      </div>
      <div className="flex flex-col items-start justify-center gap-2 p-6 xl:p-[26px]">
        <CategoryChip label={post.category} />
        <h3 className="max-w-[260px] text-[22px] font-medium leading-7 tracking-[-0.01em] text-ink">{post.title}</h3>
        <p className="max-w-[382px] text-[14.5px] leading-[22px] text-ink-500">{post.excerpt}</p>
        <p className="text-[13px] font-semibold text-ink-700">{post.author}</p>
      </div>
    </article>
  );
}

export function BlogSection({ content }: { content: BlogContent }) {
  const { data: posts = [] } = usePosts();
  const [featured, ...others] = posts.slice(0, 3);
  return (
    <section id="blog" aria-labelledby="blog-heading" className="bg-white px-5 py-16 md:px-10 xl:px-gutter xl:py-[100px]">
      <div className="mx-auto flex max-w-page flex-col gap-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2.5">
            <h2
              id="blog-heading"
              className="text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-ink xl:text-[56px] xl:leading-[56px]"
            >
              <Segments parts={content.title} accentClass="text-brand" />
            </h2>
            <p className="text-base text-ink-700">{content.lead}</p>
          </div>
          <Link to={content.linkHref} className="flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-press">
            {content.linkLabel}
            <img src={arrowBlue} alt="" className="size-[15px]" />
          </Link>
        </div>
        {featured && (
          <div className="flex flex-col gap-6 lg:flex-row">
            <Featured post={featured} />
            <div className="flex flex-1 flex-col gap-6 lg:h-[474px]">
              {others.map((p) => (
                <Compact key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
