import type { Segment } from '@/lib/types';
import ellipseAlt from '@/assets/svg/ellipse-hero-alt.svg';
import { HeroShell } from '@/components/layout/HeroShell';
import { Segments } from '@/components/ui/Heading';

export interface PolicyHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

/** Policy-page hero (Terms of Use / Privacy Policy): accent bar, spaced eyebrow, two-line heading. */
export function PolicyHero({ content }: { content: PolicyHeroContent }) {
  return (
    <HeroShell ellipse={ellipseAlt}>
      <div className="relative z-10 flex flex-col gap-[19px]">
        <div className="h-1 w-[82px] rounded-[2px] bg-brand-cyan" />
        <div className="flex flex-col gap-[41px]">
          <div className="flex max-w-[790px] flex-col gap-[35px]">
            <p className="whitespace-pre-wrap text-xs font-bold leading-[1.2] text-brand-ice">{content.eyebrow}</p>
            <div className="flex flex-col gap-[33px] text-white">
              <h1 className="whitespace-pre-line text-[36px] font-extrabold leading-[1.1] md:text-h-hero">
                <Segments parts={content.title} accentClass="text-brand-mist" />
              </h1>
              <p className="max-w-[745px] text-lg font-medium leading-[1.5]">{content.lead}</p>
            </div>
          </div>
          <div className="h-px w-full bg-keyline" />
        </div>
      </div>
    </HeroShell>
  );
}
