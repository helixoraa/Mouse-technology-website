import { HeroShell } from '@/components/layout/HeroShell';
import { Segments } from '@/components/ui/Heading';
import type { Segment } from '@/lib/types';

export interface BlogHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

/** Blog & Updates hero. */
export function BlogHero({ content }: { content?: BlogHeroContent }) {
  return (
    <HeroShell>
      {content && (
        <div className="relative z-10 flex flex-col gap-[41px]">
          <div className="flex max-w-[790px] flex-col gap-[35px]">
            <p className="text-eyebrow font-semibold uppercase text-brand-sky">{content.eyebrow}</p>
            <div className="flex flex-col gap-[33px] text-white">
              <h1 className="whitespace-pre-line text-[38px] font-extrabold leading-[1.1] md:text-h-hero">
                <Segments parts={content.title} accentClass="text-brand-sky" />
              </h1>
              <p className="max-w-[745px] text-base leading-normal md:text-lg md:leading-[1.5]">{content.lead}</p>
            </div>
          </div>
          <div className="h-px w-full bg-keyline" />
        </div>
      )}
    </HeroShell>
  );
}

export default BlogHero;
