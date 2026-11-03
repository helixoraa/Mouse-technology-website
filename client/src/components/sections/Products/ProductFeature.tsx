import { mediaUrl } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Segment } from '@/lib/types';
import { Segments } from '@/components/ui/Heading';
import { StatusChip } from '@/components/ui/StatusChip';

export interface ProductFeatureContent {
  tone: 'soft' | 'white';
  status: string;
  title: Segment[];
  subtitle: string;
  description: string;
  listTitle: string;
  items: { title: string; text: string }[];
  image: string;
  imageAlt: string;
  journeyTitle: string;
  steps: string[];
}

/** One product block: copy on the left; capability list, illustration and user journey on the right. */
export function ProductFeature({ content, id }: { content?: ProductFeatureContent; id: string }) {
  if (!content) return null;
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]', content.tone === 'soft' ? 'bg-surface-soft' : 'bg-white')}
    >
      <div className="mx-auto grid max-w-page items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,752px)] lg:gap-14">
        <div className="flex flex-col items-start gap-5">
          <StatusChip label={content.status} />
          <h2
            id={headingId}
            className="text-[36px] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink md:text-[48px] md:leading-[54px]"
          >
            <Segments parts={content.title} accentClass="text-brand" />
          </h2>
          <p className="text-xl font-bold leading-tight text-ink">{content.subtitle}</p>
          <p className="text-body text-ink-700">{content.description}</p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-xl3 border border-line bg-white p-6 shadow-card md:p-9">
            <h3 className="text-eyebrow font-semibold uppercase text-brand">{content.listTitle}</h3>
            <ul className="mt-3 flex flex-col gap-[15px]">
              {content.items.map((it) => (
                <li key={it.title} className="grid grid-cols-[8px_1fr] gap-x-3.5">
                  <span aria-hidden className="mt-2 size-2 rounded-full bg-brand-light" />
                  <div>
                    <p className="text-[17px] font-semibold leading-6 text-ink-700">{it.title}</p>
                    <p className="text-body-sm text-ink-500">{it.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <img src={mediaUrl(content.image)} alt={content.imageAlt} className="w-full rounded-xl3" loading="lazy" />
          <div className="rounded-xl3 border border-white/25 bg-vision-card p-6 text-white md:p-9">
            <h3 className="text-eyebrow font-medium uppercase text-text-soft">{content.journeyTitle}</h3>
            <ol className={cn('mt-5 grid gap-3 sm:grid-cols-2', content.steps.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
              {content.steps.map((s, i) => (
                <li key={s} className="flex min-h-[144px] flex-col gap-3 rounded-[18px] border border-white/25 bg-white/10 p-4">
                  <span className="text-xs font-medium text-text-soft">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-base font-semibold leading-5">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductFeature;
