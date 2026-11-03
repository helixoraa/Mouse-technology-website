import glow from '@/assets/svg/cta-glow.svg';
import orb from '@/assets/svg/cta-orb.svg';
import highlight from '@/assets/svg/cta-highlight.svg';
import { Button } from './Button';

export interface CtaContent {
  eyebrow: string;
  lines: string[];
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}

/** "Let's talk about what comes next." gradient CTA band (Figma "08 / CTA"). */
export function CtaCard({ content }: { content: CtaContent }) {
  return (
    <section className="bg-navy-950 px-5 py-[60px] md:px-10 xl:px-gutter" aria-labelledby="cta-heading">
      <div className="relative mx-auto flex max-w-page items-center justify-between overflow-hidden rounded-xl4 border border-white/25 bg-cta-card p-8 md:p-[72px]">
        <div aria-hidden className="pointer-events-none absolute left-[72px] top-[72px] hidden size-[360px] md:block">
          <img src={glow} alt="" className="absolute -inset-[19.44%] size-[138.88%] max-w-none" />
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[221px] top-[39px] hidden size-[220px] lg:block">
          <img src={orb} alt="" className="absolute inset-0 size-full" />
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[251px] top-[75px] hidden h-10 w-[90px] lg:block">
          <img src={highlight} alt="" className="absolute -inset-x-[11.11%] -inset-y-[25%] max-w-none" />
        </div>
        <div className="relative flex flex-col items-start gap-5">
          <p className="text-eyebrow font-semibold uppercase text-text-soft">{content.eyebrow}</p>
          <h2
            id="cta-heading"
            className="max-w-[640px] text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text-onDark md:text-h-section"
          >
            {content.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="max-w-[520px] text-body text-text-cta">{content.text}</p>
          <div className="flex flex-wrap gap-3.5">
            <Button to={content.primary.href} variant="white" withArrow>
              {content.primary.label}
            </Button>
            <Button to={content.secondary.href} variant="glass">
              {content.secondary.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
