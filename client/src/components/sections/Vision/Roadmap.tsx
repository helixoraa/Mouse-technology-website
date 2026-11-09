import type { Segment } from '@/lib/types';
import { cn } from '@/lib/cn';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { InnerBand } from '../InnerBand';

export interface RoadmapContent {
  header: { title: Segment[]; subtitle: string; description: string };
  items: { number: string; title: string; text: string; status: string }[];
}

export function Roadmap({ content }: { content: RoadmapContent }) {
  return (
    <InnerBand tone="soft">
      <SectionHeader {...content.header} />
      <ol className="flex flex-col gap-3">
        {content.items.map((r) => (
          // Below 1024 the row stacks so the description gets the full card width, with the status above it. From 1024 it
          // is one row as in the design: number, title (380), description (580 at 1440), status.
          <li
            key={r.number}
            className={cn(
              'flex flex-col items-start gap-3 rounded-3xl border border-line bg-white px-6 py-6 md:px-8 md:py-7 lg:grid lg:grid-cols-[theme(spacing.8)_minmax(0,380fr)_minmax(0,580fr)_auto] lg:items-center lg:gap-10',
              r.status.toLowerCase() !== 'planned' && 'shadow-card',
            )}
          >
            <span className="w-8 shrink-0 text-[15px] font-bold text-brand">{r.number}</span>
            <h3 className="text-[22px] font-bold text-ink">{r.title}</h3>
            <StatusChip label={r.status} className="lg:order-last" />
            <p className="min-w-0 text-body-sm text-ink-500">{r.text}</p>
          </li>
        ))}
      </ol>
    </InnerBand>
  );
}
