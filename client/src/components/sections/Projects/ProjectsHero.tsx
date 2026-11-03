import type { Segment } from '@/lib/types';
import { HeroShell } from '@/components/layout/HeroShell';
import { Segments } from '@/components/ui/Heading';

export interface ProjectsHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

export function ProjectsHero({ content }: { content: ProjectsHeroContent }) {
  return (
    <HeroShell>
      <div className="relative z-10 flex flex-col gap-[41px]">
        <div className="flex max-w-[790px] flex-col gap-[35px]">
          <p className="text-eyebrow font-semibold uppercase text-brand-sky">{content.eyebrow}</p>
          <div className="flex flex-col gap-[33px] text-white">
            <h1 className="text-[36px] font-extrabold leading-[1.1] md:text-h-hero">
              <Segments parts={content.title} accentClass="text-brand-sky" />
            </h1>
            <p className="max-w-[655px] text-lg leading-[1.5] font-medium">{content.lead}</p>
          </div>
        </div>
        <div className="h-px w-full bg-keyline" />
      </div>
    </HeroShell>
  );
}
