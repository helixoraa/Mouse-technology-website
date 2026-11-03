import type { Segment } from '@/lib/types';
import { HeroShell } from './HeroShell';
import { Segments } from '../ui/Heading';

/** Standard inner-page hero: eyebrow, large heading with accent words, lead paragraph, keyline. */
export function PageHero({
  eyebrow,
  title,
  lead,
  headingClass = 'text-[40px] leading-[1.15] md:text-h-page',
  ellipse,
  leadClass = 'text-lg leading-7 md:text-xl md:leading-7',
}: {
  leadClass?: string;
  eyebrow?: string;
  title: Segment[] | string;
  lead?: string;
  headingClass?: string;
  ellipse?: string;
}) {
  return (
    <HeroShell ellipse={ellipse}>
      <div className="relative z-10 flex flex-col gap-[41px]">
        <div className="flex max-w-[790px] flex-col gap-[35px]">
          {eyebrow && <p className="text-eyebrow font-semibold uppercase text-brand-sky">{eyebrow}</p>}
          <div className="flex flex-col gap-[33px] text-white">
            <h1 className={`font-bold tracking-[-0.03em] ${headingClass}`}>
              <Segments parts={title} accentClass="text-brand-sky" />
            </h1>
            {lead && <p className={`max-w-[655px] ${leadClass}`}>{lead}</p>}
          </div>
        </div>
        <div className="h-px w-full bg-keyline" />
      </div>
    </HeroShell>
  );
}
