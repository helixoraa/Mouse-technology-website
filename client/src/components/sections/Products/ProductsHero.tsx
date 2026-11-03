import { HeroShell } from '@/components/layout/HeroShell';
import { Segments } from '@/components/ui/Heading';
import type { Segment } from '@/lib/types';

export interface ProductsHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

export function ProductsHero({ content }: { content?: ProductsHeroContent }) {
  return (
    <HeroShell>
      {content && (
        <div className="relative z-10 flex flex-col gap-[41px]">
          <div className="flex max-w-[790px] flex-col gap-[35px]">
            <p className="text-eyebrow font-semibold uppercase text-brand-sky">{content.eyebrow}</p>
            <div className="flex flex-col gap-[33px] text-white">
              <h1 className="text-[40px] font-bold leading-[1.15] tracking-[-0.03em] md:text-h-page">
                <Segments parts={content.title} accentClass="text-brand-sky" />
              </h1>
              <p className="max-w-[745px] text-base leading-[27px] md:text-lg">{content.lead}</p>
            </div>
          </div>
          <div className="h-px w-full bg-keyline" />
        </div>
      )}
    </HeroShell>
  );
}

export default ProductsHero;
