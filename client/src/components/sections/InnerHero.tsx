import { HeroShell } from '@/components/layout/HeroShell';
import { Segments } from '@/components/ui/Heading';
import { cn } from '@/lib/cn';
import type { Segment } from '@/lib/types';

export interface InnerHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

interface Props {
  content?: InnerHeroContent;
  /** "page" = 64/84 bold (Products, Contact); "hero" = 52/57.2 extra-bold (Blog, Privacy). */
  size?: 'page' | 'hero';
  /** Privacy frame: 82x4 sky accent bar above the eyebrow, bold un-tracked eyebrow, ice-blue colour. */
  accentBar?: boolean;
  /** Max width of the lead paragraph (Figma: 655 for Products/Contact, 745 for Blog/Privacy). */
  leadWidth?: number;
  ellipse?: string;
}

/**
 * Hero used by the Products, Blog, Contact and Privacy frames. Vertical rhythm measured from the Figma SVGs:
 * eyebrow (16.4) - 35 - heading - 32.5 - lead (28/line) - 40 - 1px keyline - 80 bottom padding.
 */
export function InnerHero({ content, size = 'page', accentBar = false, leadWidth = 655, ellipse }: Props) {
  return (
    <HeroShell ellipse={ellipse}>
      {content && (
        <div className={cn('relative z-10 flex flex-col', accentBar ? 'gap-[18px]' : 'gap-[19px]')}>
          {accentBar && <div className="h-1 w-[82px] rounded-sm bg-brand-cyan" />}
          <div className="flex flex-col gap-10">
            <div className={cn('flex max-w-[790px] flex-col', accentBar ? 'gap-[33.5px]' : 'gap-[35px]')}>
              <p
                className={cn(
                  'text-xs uppercase leading-[16.4px]',
                  accentBar ? 'font-bold text-brand-ice' : 'font-semibold tracking-[0.16em] text-brand-sky',
                )}
              >
                {content.eyebrow}
              </p>
              <div className="flex flex-col gap-[32.5px] text-white">
                <h1
                  className={cn(
                    'whitespace-pre-line tracking-[-0.03em]',
                    size === 'page'
                      ? 'text-[40px] font-bold leading-[1.15] md:text-h-page'
                      : 'text-[38px] font-extrabold leading-[1.1] md:text-h-hero md:tracking-normal',
                  )}
                >
                  <Segments parts={content.title} accentClass={accentBar ? 'text-brand-mist' : 'text-brand-sky'} />
                </h1>
                <p className="text-base font-medium leading-normal md:text-lg md:leading-7" style={{ maxWidth: leadWidth }}>
                  {content.lead}
                </p>
              </div>
            </div>
            <div className="h-px w-full shrink-0 bg-keyline" />
          </div>
        </div>
      )}
    </HeroShell>
  );
}

export default InnerHero;
