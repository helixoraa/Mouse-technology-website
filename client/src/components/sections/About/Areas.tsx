import type { Segment } from '@/lib/types';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { InnerBand } from '../InnerBand';

export interface AreasContent {
  header: { title: Segment[]; subtitle: string; description: string };
  items: { number: string; status: string; title: string; text: string }[];
}

export function Areas({ content }: { content: AreasContent }) {
  return (
    <InnerBand tone="white">
      <SectionHeader {...content.header} />
      <ul className="grid grid-cols-1 gap-5 xl:gap-y-14 md:grid-cols-2 xl:grid-cols-3">
        {content.items.map((a) => (
          <li key={a.number} className="flex flex-col gap-5 rounded-xl2 border border-line bg-white p-8 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-brand">{a.number}</span>
              <StatusChip label={a.status} />
            </div>
            <h3 className="break-words text-h-card font-bold text-ink max-sm:text-xl">{a.title}</h3>
            <p className="text-body-sm text-ink-500">{a.text}</p>
          </li>
        ))}
      </ul>
    </InnerBand>
  );
}
