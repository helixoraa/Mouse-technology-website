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
          <li
            key={r.number}
            className={cn(
              'flex flex-col items-start gap-3 rounded-3xl border border-line bg-white px-6 py-6 md:flex-row md:items-center md:gap-10 md:px-8 md:py-7',
              r.status.toLowerCase() !== 'planned' && 'shadow-card',
            )}
          >
            <span className="w-8 shrink-0 text-[15px] font-bold text-brand">{r.number}</span>
            <h3 className="shrink-0 text-[22px] font-bold text-ink md:w-[380px]">{r.title}</h3>
            <p className="min-w-0 flex-1 text-body-sm text-ink-500">{r.text}</p>
            <StatusChip label={r.status} />
          </li>
        ))}
      </ol>
    </InnerBand>
  );
}
