import { icons } from '@/lib/icons';
import type { Segment } from '@/lib/types';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { InnerBand } from '../InnerBand';

export interface PillarsContent {
  header: { title: Segment[]; subtitle: string; description: string };
  items: { icon: string; word: string; title: string; text: string }[];
}

export function Pillars({ content }: { content: PillarsContent }) {
  return (
    <InnerBand tone="white">
      <SectionHeader {...content.header} />
      <ul className="grid gap-5 md:grid-cols-3">
        {content.items.map((p) => (
          <li key={p.word} className="flex flex-col gap-5 rounded-xl2 border border-line bg-white p-8 shadow-policy">
            <span className="flex w-fit items-start rounded-2xl bg-icon-tile p-3.5">
              <img src={icons[p.icon]} alt="" className="size-[26px]" />
            </span>
            <p className="text-[40px] font-extrabold tracking-[-0.02em] text-ink">{p.word}</p>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-ink-700">{p.title}</h3>
              <p className="max-w-[330px] text-body-sm text-ink-500">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </InnerBand>
  );
}
