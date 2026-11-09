import { mediaUrl } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Segment } from '@/lib/types';
import { Segments } from '@/components/ui/Heading';
import { StatusChip } from '@/components/ui/StatusChip';
import { AnimatedMedia, type AnimationContent } from '@/components/ui/AnimatedMedia';

export interface ProductFeatureContent {
  tone: 'soft' | 'white';
  status: string;
  title: Segment[];
  subtitle: string;
  description: string;
  listTitle: string;
  items: { title: string; text: string }[];
  /** Animated illustration (SVG/SMIL) with a static WebP final frame; swappable in the admin. */
  animation?: AnimationContent;
  /** Slot size from Figma (752x426 for bus fare, 752x627 for payment). */
  imageWidth?: number;
  imageHeight?: number;
  /** Fallback still image when no animation is configured. */
  image?: string;
  imageAlt?: string;
  journeyTitle: string;
  steps: string[];
}

/** One product block: copy on the left (480px); capability list, illustration and user journey on the right (752px). */
export function ProductFeature({ content, id }: { content?: ProductFeatureContent; id: string }) {
  if (!content) return null;
  const headingId = `${id}-heading`;
  const w = content.imageWidth ?? 752;
  const h = content.imageHeight ?? 426;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'px-5 py-16 leading-[normal] md:px-10 xl:px-gutter xl:py-[110px]',
        content.tone === 'soft' ? 'bg-surface-soft' : 'bg-white',
      )}
    >
      <div className="mx-auto grid max-w-page items-start gap-10 lg:grid-cols-[minmax(0,480fr)_minmax(0,752fr)] xl:gap-16">
        <div className="flex flex-col items-start gap-5">
          <StatusChip label={content.status} />
          <h2
            id={headingId}
            className="text-[36px] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink md:text-[48px] md:leading-[54px]"
          >
            <Segments parts={content.title} accentClass="text-brand" />
          </h2>
          <p className="text-xl font-bold text-ink">{content.subtitle}</p>
          <p className="text-[17px] leading-7 text-ink-700">{content.description}</p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-xl2 border border-line bg-white p-6 shadow-card md:p-9">
            <h3 className="text-eyebrow font-semibold uppercase text-brand">{content.listTitle}</h3>
            <ul className="mt-4 flex flex-col gap-4">
              {content.items.map((it) => (
                <li key={it.title} className="grid grid-cols-[8px_1fr] gap-x-3.5">
                  <span aria-hidden className="mt-2 size-2 rounded-full bg-brand-sky" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-base font-bold leading-6 text-ink-700">{it.title}</p>
                    <p className="text-[14.5px] leading-5 text-ink-500">{it.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {content.animation ? (
            <AnimatedMedia
              src={content.animation.src}
              staticSrc={content.animation.staticImage}
              alt={content.animation.alt}
              width={w}
              height={h}
              radius={36}
              className="w-full"
            />
          ) : (
            content.image && (
              <img
                src={mediaUrl(content.image)}
                alt={content.imageAlt ?? ''}
                width={w}
                height={h}
                className="w-full rounded-xl3"
                style={{ aspectRatio: `${w} / ${h}` }}
                loading="lazy"
              />
            )
          )}
          <div className="rounded-xl2 border border-white/25 bg-cta-card p-6 text-white md:p-9">
            <h3 className="text-eyebrow font-semibold uppercase text-text-soft">{content.journeyTitle}</h3>
            <ol className={cn('mt-5 grid gap-3 sm:grid-cols-2', content.steps.length > 4 ? 'xl:grid-cols-5' : 'xl:grid-cols-4')}>
              {content.steps.map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    'flex min-h-[88px] flex-col gap-2.5 rounded-[18px] border border-white/25 bg-white/10 p-4',
                    content.steps.length > 4 ? 'lg:min-h-[126px]' : 'lg:min-h-[146px]',
                  )}
                >
                  <span className="text-[13px] font-bold text-text-soft">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15px] font-bold leading-5">{s}</span>
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
