import { HeroShell } from '@/components/layout/HeroShell';
import ellipseAlt from '@/assets/svg/ellipse-hero-alt.svg';
import { Segments } from '@/components/ui/Heading';
import type { Segment } from '@/lib/types';

export interface LegalHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

/** Legal-page hero (Privacy / Terms frames): accent bar, eyebrow, 52px heading, lead, keyline. */
export function LegalHero({ content }: { content?: LegalHeroContent }) {
  return (
    <HeroShell ellipse={ellipseAlt}>
      {content && (
        <div className="relative z-10 flex flex-col gap-[19px]">
          <div className="h-1 w-[82px] rounded-sm bg-brand-cyan" />
          <div className="flex flex-col gap-[41px]">
            <div className="flex max-w-[790px] flex-col gap-[35px]">
              <p className="text-xs font-bold uppercase leading-[1.2] text-brand-ice">{content.eyebrow}</p>
              <div className="flex flex-col gap-[33px] text-white">
                <h1 className="whitespace-pre-line text-[38px] font-extrabold leading-[1.1] md:text-h-hero">
                  <Segments parts={content.title} accentClass="text-brand-mist" />
                </h1>
                <p className="max-w-[745px] text-base font-medium leading-normal md:text-lg md:leading-[1.5]">{content.lead}</p>
              </div>
            </div>
            <div className="h-px w-full bg-keyline" />
          </div>
        </div>
      )}
    </HeroShell>
  );
}

export default LegalHero;
