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
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-24">
        <img
          src={mediaUrl(content.image)}
          alt={content.imageAlt}
          className="h-auto w-full max-w-[552px] rounded-xl4 border border-white/25 object-cover lg:h-[451px] lg:w-[552px] lg:shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-6 text-xl text-ink">
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
