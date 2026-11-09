import type { Segment } from '@/lib/types';
import { Segments } from '@/components/ui/Heading';
import { InnerBand } from '../InnerBand';

export interface WhoWeAreContent {
  heading: Segment[];
  lead: string;
  body: string;
}

export function WhoWeAre({ content }: { content: WhoWeAreContent }) {
  return (
    <InnerBand tone="soft">
      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,560fr)_minmax(0,736fr)] lg:gap-0">
        <h2 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-ink md:text-[40px] md:leading-[50px]">
          <Segments parts={content.heading} accentClass="text-brand" />
        </h2>
        <div className="flex min-w-0 flex-col gap-6">
          <p className="text-xl font-medium leading-[30px] text-ink">{content.lead}</p>
          <p className="text-body text-ink-700">{content.body}</p>
        </div>
      </div>
    </InnerBand>
  );
}
