import type { Segment } from '@/lib/types';
import { mediaUrl } from '@/lib/api';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { InnerBand } from '../InnerBand';

export interface LeadershipContent {
  header: { title: Segment[]; subtitle: string; description: string };
  image: string;
  imageAlt: string;
  paragraphs: string[];
}

export function Leadership({ content }: { content: LeadershipContent }) {
  const [lead, ...rest] = content.paragraphs;
  return (
    <InnerBand tone="soft">
      <SectionHeader {...content.header} />
      <div className="flex flex-col items-center gap-10 lg:grid lg:grid-cols-[minmax(0,552fr)_minmax(0,648fr)] lg:gap-24">
        <img
          src={mediaUrl(content.image)}
          alt={content.imageAlt}
          className="aspect-[552/451] h-auto w-full max-w-[552px] rounded-xl4 border border-white/25 object-cover lg:max-w-none"
        />
        <div className="flex min-w-0 flex-col gap-6 text-xl text-ink">
          <p className="font-medium leading-[30px]">{lead}</p>
          {rest.map((p) => (
            <p key={p} className="font-normal leading-[27px]">
              {p}
            </p>
          ))}
        </div>
      </div>
    </InnerBand>
  );
}
