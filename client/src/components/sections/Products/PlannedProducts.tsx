import type { Segment } from '@/lib/types';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';

export interface PlannedProductsContent {
  title: Segment[];
  subtitle: string;
  description: string;
  items: { title: string; status: string; text: string }[];
}

/** "More technology to come" — planned products. */
export function PlannedProducts({ content }: { content?: PlannedProductsContent }) {
  if (!content) return null;
  return (
    <section className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]" aria-label="Planned products">
      <div className="mx-auto flex max-w-page flex-col gap-14">
        <SectionHeader title={content.title} subtitle={content.subtitle} description={content.description} />
        <div className="grid gap-5 md:grid-cols-2">
          {content.items.map((it) => (
            <article key={it.title} className="flex min-h-[172px] flex-col gap-3.5 rounded-xl2 border border-line bg-white p-9 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[26px] font-extrabold leading-8 tracking-[-0.01em] text-ink">{it.title}</h3>
                <StatusChip label={it.status} />
              </div>
              <p className="text-base leading-6 text-ink-500">{it.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlannedProducts;
