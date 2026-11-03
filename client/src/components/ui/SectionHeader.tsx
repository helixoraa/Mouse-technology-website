import type { Segment } from '@/lib/types';
import { Segments } from './Heading';

/** Section header: large heading with accent words, bold subtitle, description on the right (stacks on small screens). */
export function SectionHeader({ title, subtitle, description }: { title: Segment[] | string; subtitle?: string; description?: string }) {
  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="flex flex-col gap-3.5">
        <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink md:text-h-section">
          <Segments parts={title} accentClass="text-brand" />
        </h2>
        {subtitle && <p className="text-xl font-bold leading-[normal] text-ink">{subtitle}</p>}
      </div>
      {description && <p className="max-w-[440px] text-body text-ink-700">{description}</p>}
    </div>
  );
}
